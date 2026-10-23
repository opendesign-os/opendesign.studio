import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import type { EffectStyle, FoleyKind, Placement, Transition } from '@opendesign/models'
import { formats, sequence } from '@opendesign/models'
import { assets, episodes, series, shots } from '@opendesign/schemas'
import { asc, eq } from 'drizzle-orm'
import binary from 'ffmpeg-static'
import mime from 'mime'
import type { Database } from '../../../common/database/database.module'
import { type Media, StorageService } from '../../../common/storage/storage.service'
import type { Context, Job } from './context'

const FPS = 30
const ENTER = 0.45
const FADE = 0.2
const FONT = 'Noto Sans SC'

const blends: Record<Exclude<Transition, 'cut'>, string> = {
  fade: 'fadeblack',
  wipe: 'wipeleft',
  flash: 'fadewhite',
  slide: 'slideleft',
}

const foley: Record<FoleyKind, string> = {
  rain: 'anoisesrc=c=white:a=0.35,highpass=f=900,lowpass=f=6500',
  wind: 'anoisesrc=c=brown:a=0.6,lowpass=f=450,tremolo=f=0.2:d=0.6',
  crowd: 'anoisesrc=c=pink:a=0.5,bandpass=f=900:w=600,lowpass=f=2600',
  train: 'anoisesrc=c=brown:a=0.7,lowpass=f=280,apulsator=hz=3.1:amount=0.6',
  fire: 'anoisesrc=c=brown:a=0.35,lowpass=f=700,tremolo=f=11:d=0.7',
  water: 'anoisesrc=c=pink:a=0.5,bandpass=f=1400:w=900,tremolo=f=5:d=0.4',
  footsteps: "aevalsrc=exprs='0.9*sin(2*PI*110*t)*exp(-28*mod(t,0.5))':s=48000",
  heartbeat:
    "aevalsrc=exprs='sin(2*PI*62*t)*(exp(-22*mod(t,0.85))+0.75*exp(-22*mod(t+0.63,0.85)))':s=48000",
  door: "aevalsrc=exprs='0.25*sin(2*PI*(230-160*t)*t)*lt(t,0.5)+0.9*sin(2*PI*95*t)*exp(-12*(t-0.5))*gte(t,0.5)':s=48000",
  glass: 'anoisesrc=c=white:a=0.6,highpass=f=3400,afade=t=out:d=0.4',
  bell: "aevalsrc=exprs='(0.4*sin(2*PI*523*t)+0.2*sin(2*PI*1046*t)+0.13*sin(2*PI*1443*t)+0.1*sin(2*PI*2129*t))*exp(-1.6*t)':s=48000",
  rumble: "aevalsrc=exprs='0.5*sin(2*PI*46*t)':s=48000,lowpass=f=140",
}

const lettering: Record<EffectStyle, (unit: number) => string> = {
  impact: (unit) => `\\fs${Math.round(unit * 3.4)}\\b1\\frz6`,
  soft: (unit) => `\\fs${Math.round(unit * 2.4)}\\alpha&H33&`,
  speed: (unit) => `\\fs${Math.round(unit * 2.8)}\\b1\\i1`,
  glow: (unit) => `\\fs${Math.round(unit * 3)}\\b1\\blur4`,
}

function seconds(value: number) {
  return value.toFixed(3)
}

function stamp(value: number) {
  const centis = Math.round(value * 100)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${Math.floor(centis / 360000)}:${pad(Math.floor(centis / 6000) % 60)}:${pad(Math.floor(centis / 100) % 60)}.${pad(centis % 100)}`
}

function bgr(hex: string) {
  return `&H${hex.slice(5, 7)}${hex.slice(3, 5)}${hex.slice(1, 3)}&`.toUpperCase()
}

function text(value: string) {
  return value.replaceAll('{', '（').replaceAll('}', '）').replaceAll('\n', '\\N')
}

function subtitles(
  placements: Placement[],
  names: Map<string, { name: string; color: string }>,
  width: number,
  height: number,
) {
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
    `Style: bubble,${FONT},${Math.round(unit * 1.5)},&H00000000,&H00000000,&H00FFFFFF,&H00FFFFFF,0,0,0,0,100,100,0,0,3,${Math.round(unit * 0.8)},0,5,0,0,0,1`,
    `Style: effect,${FONT},${Math.round(unit * 3)},&H00FFFFFF,&H00FFFFFF,&H00202020,&H00000000,-1,0,0,0,100,100,0,0,1,${Math.round(unit * 0.25)},${Math.round(unit * 0.15)},5,0,0,0,1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ]
  const event = (layer: number, start: number, end: number, style: string, body: string) =>
    lines.push(`Dialogue: ${layer},${stamp(start)},${stamp(end)},${style},,0,0,0,,${body}`)
  const at = (x: number, y: number) =>
    `\\an5\\pos(${Math.round((x / 100) * width)},${Math.round((y / 100) * height)})`

  for (const { shot, start } of placements) {
    for (const line of shot.dialogue) {
      event(0, start + line.start, start + line.start + line.duration, 'caption', text(line.line))
    }
    for (const bubble of shot.bubbles) {
      const speaker = names.get(bubble.assetId)
      const label =
        speaker && bubble.shape !== 'caption'
          ? `{\\fs${Math.round(unit * 1.1)}\\c${bgr(speaker.color)}}${text(speaker.name)}{\\r} `
          : ''
      event(
        1,
        start + bubble.start,
        start + bubble.start + bubble.duration,
        'bubble',
        `{${at(bubble.x, bubble.y)}}${label}${text(bubble.text)}`,
      )
    }
    for (const effect of shot.effects) {
      event(
        2,
        start + effect.start,
        start + effect.start + effect.duration,
        'effect',
        `{${at(effect.x, effect.y)}${lettering[effect.style](unit)}}${text(effect.text)}`,
      )
    }
  }
  return lines.join('\n')
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
    const roster = await this.db
      .select({ id: assets.id, name: assets.name, color: assets.color })
      .from(assets)
      .where(eq(assets.seriesId, found.episode.seriesId))
    const names = new Map(roster.map((item) => [item.id, item]))
    const placements = sequence(rows.map((row) => ({ ...row, video: row.video ?? undefined })))
    const total = placements.at(-1)?.end ?? 0
    const { width, height } = formats[found.aspect]
    const folder = await mkdtemp(join(tmpdir(), 'compose-'))

    try {
      const inputs: string[] = []
      const graph: string[] = []
      const voices: string[] = []
      const save = async (name: string, media: Media) => {
        const file = `${name}.${mime.getExtension(media.type) ?? 'bin'}`
        await writeFile(join(folder, file), media.data)
        inputs.push('-i', file)
        return inputs.length / 2 - 1
      }

      for (const [position, { shot }] of placements.entries()) {
        const duration = seconds(shot.duration)
        const image = shot.keyframes.find((item) => item.slot === 'first')?.image
        const tail = `setsar=1,format=yuv420p,settb=1/${FPS}[v${position}]`
        if (shot.video) {
          const input = await save(`shot-${position}`, await this.storage.get(shot.video))
          graph.push(
            `[${input}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},fps=${FPS},tpad=stop_mode=clone:stop_duration=${duration},trim=duration=${duration},setpts=PTS-STARTPTS,${tail}`,
          )
        } else if (image) {
          const input = await save(`shot-${position}`, await this.storage.get(image))
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
      await writeFile(join(folder, 'subtitles.ass'), subtitles(placements, names, width, height))
      graph.push(`[${current}]ass=subtitles.ass[video]`)

      graph.push(`anullsrc=r=48000:cl=stereo,atrim=duration=${seconds(total)}[silence]`)
      for (const { shot, start } of placements) {
        for (const line of shot.dialogue) {
          if (!line.audio) continue
          const input = await save(`line-${voices.length}`, await this.storage.get(line.audio))
          const label = `d${voices.length}`
          graph.push(
            `[${input}:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=${Math.round((start + line.start) * 1000)}:all=1[${label}]`,
          )
          voices.push(label)
        }
        for (const sound of shot.sounds) {
          const label = `s${voices.length}`
          graph.push(
            `${foley[sound.kind]},aformat=sample_rates=48000:channel_layouts=stereo,atrim=duration=${seconds(sound.duration)},afade=t=in:d=${FADE},afade=t=out:st=${seconds(Math.max(0, sound.duration - FADE))}:d=${FADE},adelay=${Math.round((start + sound.start) * 1000)}:all=1[${label}]`,
          )
          voices.push(label)
        }
      }
      graph.push(
        `[silence]${voices.map((label) => `[${label}]`).join('')}amix=inputs=${voices.length + 1}:duration=first:normalize=0[audio]`,
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
          '[video]',
          '-map',
          '[audio]',
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
          'output.mp4',
        ],
        folder,
        total,
        progress,
      )
      const output = await this.storage.put(task.organizationId, {
        data: new Uint8Array(await readFile(join(folder, 'output.mp4'))),
        type: 'video/mp4',
      })
      await this.db.update(episodes).set({ output }).where(eq(episodes.id, found.episode.id))
    } finally {
      await rm(folder, { recursive: true, force: true })
    }
  }
}
