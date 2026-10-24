import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import type { Placement, Transition } from '@opendesign/models'
import { formats, sequence } from '@opendesign/models'
import { episodes, series, shots } from '@opendesign/schemas'
import { asc, eq } from 'drizzle-orm'
import binary from 'ffmpeg-static'
import mime from 'mime'
import type { Database } from '../../../common/database/database.module'
import { type Media, StorageService } from '../../../common/storage/storage.service'
import type { Context, Job } from './context'

const FPS = 30
const ENTER = 0.45
const FONT = 'Noto Sans SC'

const blends: Record<Exclude<Transition, 'cut'>, string> = {
  fade: 'fadeblack',
  wipe: 'wipeleft',
  flash: 'fadewhite',
  slide: 'slideleft',
}

function seconds(value: number) {
  return value.toFixed(3)
}

function stamp(value: number) {
  const centis = Math.round(value * 100)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${Math.floor(centis / 360000)}:${pad(Math.floor(centis / 6000) % 60)}:${pad(Math.floor(centis / 100) % 60)}.${pad(centis % 100)}`
}

function text(value: string) {
  return value.replaceAll('{', '（').replaceAll('}', '）').replaceAll('\n', '\\N')
}

function subtitles(placements: Placement[], width: number, height: number) {
  const unit = Math.min(width, height) / 100
  const lines = [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: caption,${FONT},${Math.round(unit * 3.4)},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,${Math.round(unit * 0.3)},${Math.round(unit * 0.1)},2,${Math.round(width * 0.08)},${Math.round(width * 0.08)},${Math.round(height * 0.06)},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ]
  const event = (layer: number, start: number, end: number, style: string, body: string) =>
    lines.push(`Dialogue: ${layer},${stamp(start)},${stamp(end)},${style},,0,0,0,,${body}`)
  for (const { shot, start } of placements) {
    for (const line of shot.dialogue) {
      event(0, start + line.start, start + line.start + line.duration, 'caption', text(line.line))
    }
  }
  return lines.join('\n')
}

function encode(total: number) {
  return [
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    '-t',
    seconds(total),
  ]
}

function probe(file: string, cwd: string) {
  return new Promise<boolean>((resolve) => {
    if (!binary) {
      resolve(false)
      return
    }
    const child = spawn(binary, ['-hide_banner', '-i', file], { cwd })
    let report = ''
    child.stderr.on('data', (chunk: Buffer) => {
      report += String(chunk)
    })
    child.on('error', () => resolve(false))
    child.on('close', () => resolve(/Stream #\d+:\d+.*: Audio:/.test(report)))
  })
}

function render(args: string[], cwd: string, total: number, progress: Context['progress']) {
  return new Promise<void>((resolve, reject) => {
    if (!binary) {
      reject(new Error('找不到 ffmpeg'))
      return
    }
    const child = spawn(binary, args, { cwd })
    let failure = ''
    child.stdout.on('data', (chunk: Buffer) => {
      const match = /out_time_us=(\d+)/.exec(String(chunk))
      if (match) void progress(Math.min(95, (Number(match[1]) / 1e6 / total) * 95))
    })
    child.stderr.on('data', (chunk: Buffer) => {
      failure = (failure + String(chunk)).slice(-2000)
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`合成失败：${failure.trim().split('\n').at(-1) ?? code}`))
    })
  })
}

@Injectable()
export class ComposeJob implements Job {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly storage: StorageService,
  ) {}

  async run({ task, progress }: Context) {
    if (task.request.kind !== 'compose') throw new Error('任务类型不匹配')
    const [found] = await this.db
      .select({ episode: episodes, aspect: series.aspect })
      .from(episodes)
      .innerJoin(series, eq(series.id, episodes.seriesId))
      .where(eq(episodes.id, task.request.episodeId))
    if (!found) throw new Error('分集不存在')
    const rows = await this.db
      .select()
      .from(shots)
      .where(eq(shots.episodeId, found.episode.id))
      .orderBy(asc(shots.index))
    if (!rows.length) throw new Error('这一集还没有镜头')
    const placements = sequence(rows.map((row) => ({ ...row, video: row.video ?? undefined })))
    const total = placements.at(-1)?.end ?? 0
    const { width, height } = formats[found.aspect]
    const folder = await mkdtemp(join(tmpdir(), 'compose-'))

    try {
      const inputs: string[] = []
      const graph: string[] = []
      const voices: string[] = []
      const ambience: { input: number; start: number; duration: number }[] = []
      const save = async (name: string, media: Media) => {
        const file = `${name}.${mime.getExtension(media.type) ?? 'bin'}`
        await writeFile(join(folder, file), media.data)
        inputs.push('-i', file)
        return { input: inputs.length / 2 - 1, file }
      }

      for (const [position, { shot, start }] of placements.entries()) {
        const duration = seconds(shot.duration)
        const image = shot.keyframes.find((item) => item.slot === 'first')?.image
        const tail = `setsar=1,format=yuv420p,settb=1/${FPS}[v${position}]`
        if (shot.video) {
          const { input, file } = await save(`shot-${position}`, await this.storage.get(shot.video))
          if (await probe(file, folder)) {
            ambience.push({ input, start, duration: shot.duration })
          }
          graph.push(
            `[${input}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},fps=${FPS},tpad=stop_mode=clone:stop_duration=${duration},trim=duration=${duration},setpts=PTS-STARTPTS,${tail}`,
          )
        } else if (image) {
          const { input } = await save(`shot-${position}`, await this.storage.get(image))
          const frames = Math.max(2, Math.round(shot.duration * FPS))
          const { from, to } = shot.move
          const t = `on/${frames - 1}`
          const zoom = `max(1,${from.scale}+(${to.scale - from.scale})*${t})`
          const x = `max(0,min(iw-iw/zoom,iw/2+(${from.x}+(${to.x - from.x})*${t})*iw/100-iw/zoom/2))`
          const y = `max(0,min(ih-ih/zoom,ih/2+(${from.y}+(${to.y - from.y})*${t})*ih/100-ih/zoom/2))`
          graph.push(
            `[${input}:v]scale=${width * 2}:${height * 2}:force_original_aspect_ratio=increase,crop=${width * 2}:${height * 2},zoompan=z='${zoom}':x='${x}':y='${y}':d=${frames}:s=${width}x${height}:fps=${FPS},trim=duration=${duration},setpts=PTS-STARTPTS,${tail}`,
          )
        } else {
          graph.push(`color=c=0x1c1c22:s=${width}x${height}:r=${FPS}:d=${duration},${tail}`)
        }
      }

      let current = 'v0'
      for (const [position, { shot, start }] of placements.entries()) {
        if (!position) continue
        const output = `c${position}`
        if (shot.transition === 'cut') {
          graph.push(`[${current}][v${position}]concat=n=2:v=1:a=0,settb=1/${FPS}[${output}]`)
        } else {
          graph.push(
            `[${current}]tpad=stop_mode=clone:stop_duration=${ENTER}[p${position}]`,
            `[p${position}][v${position}]xfade=transition=${blends[shot.transition]}:duration=${ENTER}:offset=${seconds(start)}[${output}]`,
          )
        }
        current = output
      }
      const side = formats[width > height ? '9:16' : '16:9']
      await writeFile(join(folder, 'main.ass'), subtitles(placements, width, height))
      await writeFile(join(folder, 'side.ass'), subtitles(placements, side.width, side.height))
      graph.push(
        `[${current}]split=2[m0][s0]`,
        '[m0]ass=main.ass[main]',
        '[s0]split=2[s1][s2]',
        `[s1]scale=${side.width}:${side.height}:force_original_aspect_ratio=increase,crop=${side.width}:${side.height},gblur=sigma=36[blur]`,
        `[s2]scale=${side.width}:${side.height}:force_original_aspect_ratio=decrease[fit]`,
        '[blur][fit]overlay=(W-w)/2:(H-h)/2,setsar=1,ass=side.ass[side]',
      )

      graph.push(`anullsrc=r=48000:cl=stereo,atrim=duration=${seconds(total)}[silence]`)
      for (const item of ambience) {
        const label = `n${voices.length}`
        graph.push(
          `[${item.input}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=duration=${seconds(item.duration)},asetpts=PTS-STARTPTS,adelay=${Math.round(item.start * 1000)}:all=1[${label}]`,
        )
        voices.push(label)
      }
      graph.push(
        `[silence]${voices.map((label) => `[${label}]`).join('')}amix=inputs=${voices.length + 1}:duration=first:normalize=0,alimiter=limit=0.95,asplit=2[sound][echo]`,
      )
      await writeFile(join(folder, 'graph.txt'), graph.join(';\n'))
      await progress(5)

      await render(
        [
          '-y',
          '-hide_banner',
          '-loglevel',
          'error',
          '-nostats',
          '-progress',
          'pipe:1',
          ...inputs,
          '-filter_complex_script',
          'graph.txt',
          '-map',
          '[main]',
          '-map',
          '[sound]',
          ...encode(total),
          'main.mp4',
          '-map',
          '[side]',
          '-map',
          '[echo]',
          ...encode(total),
          'side.mp4',
        ],
        folder,
        total,
        progress,
      )
      const keep = async (file: string) =>
        this.storage.put(task.organizationId, {
          data: new Uint8Array(await readFile(join(folder, file))),
          type: 'video/mp4',
        })
      const wide = width > height
      const main = await keep('main.mp4')
      const other = await keep('side.mp4')
      await this.db
        .update(episodes)
        .set({ landscape: wide ? main : other, portrait: wide ? other : main })
        .where(eq(episodes.id, found.episode.id))
    } finally {
      await rm(folder, { recursive: true, force: true })
    }
  }
}
