import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import { tenth } from '@opendesign/common'
import type { Dialogue, Layer } from '@opendesign/models'
import {
  arrange,
  assetKind,
  assetKindLabel,
  camera,
  cameraLabel,
  emotion,
  emotionLabel,
  formats,
  MAX_DURATION,
  MIN_DURATION,
  moves,
  shotSize,
  shotSizeLabel,
  transition,
  transitionLabel,
} from '@opendesign/models'
import { assets, candidates, episodes, series, shots } from '@opendesign/schemas'
import { generateText, Output } from 'ai'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { Database } from '../../../common/database/database.module'
import { attempt } from '../../providers/attempt'
import { ProvidersService } from '../../providers/providers.service'
import { language } from '../../vendors/protocols'
import type { Context, Job } from './context'

const breakdown = z.object({
  shots: z.array(
    z.object({
      scene: z.string(),
      size: shotSize,
      camera,
      prompt: z.string(),
      cast: z.array(z.string()),
      dialogue: z.array(z.object({ speaker: z.string(), line: z.string(), emotion })),
      duration: z.number(),
      transition,
    }),
  ),
  candidates: z.array(
    z.object({
      kind: assetKind,
      name: z.string(),
      prompt: z.string(),
      mentions: z.number().int(),
    }),
  ),
})

const contract = JSON.stringify(z.toJSONSchema(breakdown))

const grains: Record<string, string> = {
  coarse: '每场戏拆 2–4 个镜头',
  standard: '每场戏拆 3–6 个镜头',
  fine: '每场戏拆 5–10 个镜头',
}

const planes: Layer[] = [
  { plane: 'back', depth: 0.45, hidden: false },
  { plane: 'mid', depth: 0.75, hidden: false },
  { plane: 'fore', depth: 1, hidden: false },
]

const PACE = 4.5
const LEAD = 0.5
const GAP = 0.3

function legend(labels: Record<string, string>) {
  return Object.entries(labels)
    .map(([key, label]) => `${key}=${label}`)
    .join('，')
}

@Injectable()
export class ScriptJob implements Job {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly providers: ProvidersService,
  ) {}

  async run({ task, signal, progress }: Context) {
    if (task.request.kind !== 'script') throw new Error('任务类型不匹配')
    const { episodeId } = task.request
    const [episode] = await this.db.select().from(episodes).where(eq(episodes.id, episodeId))
    if (!episode) throw new Error('分集不存在')
    if (!episode.script.trim()) throw new Error('剧本还是空的')
    const [work] = await this.db.select().from(series).where(eq(series.id, episode.seriesId))
    if (!work) throw new Error('作品不存在')
    const roster = await this.db.select().from(assets).where(eq(assets.seriesId, work.id))
    const settings = await this.providers.read(task.organizationId, 'text')
    await progress(10)

    const system = [
      '你是短剧与漫剧的分镜师，把剧本拆成可以直接生成画面的镜头表。',
      `- 按剧本的场次分组，scene 写成「场一 · 地铁站台 / 夜」的格式，${grains[String(settings.params.grain)] ?? grains.standard}。`,
      `- size 取值：${legend(shotSizeLabel)}。`,
      `- camera 取值：${legend(cameraLabel)}。`,
      `- transition 取值：${legend(transitionLabel)}，换场处优先用 fade。`,
      `- emotion 取值：${legend(emotionLabel)}。`,
      '- prompt 用一两句话写清画面里的人物、动作、环境与光线，出现的已有资产用「@名称」标注。',
      '- cast 列出镜头里出现的资产名称，只能使用资产表里的名称。',
      '- dialogue 把剧本台词原文逐句放进对应镜头，speaker 写说话人名称，旁白写「旁白」，不要改写台词。',
      '- duration 是秒数，一般 2–6 秒，有台词时要能容纳台词。',
      `- candidates 列出剧本里出现但资产表里没有的角色、场景、道具，kind 取值：${legend(assetKindLabel)}，prompt 写外观描述，mentions 是出现次数。`,
      `- 只输出一个 JSON 对象，结构遵循这份 JSON Schema：${contract}`,
    ].join('\n')

    const prompt = [
      `作品：${work.title}（${formats[work.aspect].label} ${work.aspect}）`,
      `梗概：${work.synopsis || '暂无'}`,
      '资产表：',
      ...(roster.length
        ? roster.map(
            (item) => `- ${assetKindLabel[item.kind]} ${item.name}：${item.summary || item.prompt}`,
          )
        : ['- 暂无']),
      `第 ${episode.index} 集《${episode.title}》剧本：`,
      episode.script,
    ].join('\n')

    const { output } = await attempt(settings, (model) =>
      generateText({
        model: language(settings, model),
        system,
        prompt,
        output: Output.object({ schema: breakdown }),
        maxOutputTokens: Number(settings.params.tokens) || 8192,
        temperature: Number(settings.params.temperature ?? 0.7),
        abortSignal: signal,
      }),
    )
    await progress(80)

    const names = new Map(roster.map((item) => [item.name, item.id]))
    const drafts = output.shots.map((item, position) => {
      let cursor = LEAD
      const dialogue: Dialogue[] = item.dialogue.map((line) => {
        const length = tenth(Math.max(1, line.line.length / PACE))
        const entry = {
          id: randomUUID(),
          assetId: names.get(line.speaker) ?? '',
          line: line.line,
          emotion: line.emotion,
          start: tenth(cursor),
          duration: length,
        }
        cursor += length + GAP
        return entry
      })
      return {
        id: randomUUID(),
        episodeId,
        organizationId: task.organizationId,
        index: position + 1,
        scene: item.scene,
        size: item.size,
        move: { kind: item.camera, ...moves[item.camera], easing: 'inout' as const },
        layers: planes,
        prompt: item.prompt,
        cast: item.cast.map((name) => names.get(name)).filter((id): id is string => Boolean(id)),
        keyframes: [
          { slot: 'first' as const, ready: false },
          { slot: 'last' as const, ready: false },
        ],
        dialogue,
        transition: item.transition,
        duration: tenth(
          Math.min(MAX_DURATION, Math.max(MIN_DURATION, item.duration, cursor - GAP + LEAD)),
        ),
      }
    })
    const spots = arrange(drafts)
    const fresh = output.candidates.filter((item) => !names.has(item.name))

    await this.db.transaction(async (tx) => {
      await tx.delete(shots).where(eq(shots.episodeId, episodeId))
      await tx.delete(candidates).where(eq(candidates.episodeId, episodeId))
      if (drafts.length) {
        await tx
          .insert(shots)
          .values(
            drafts.map((item) => ({ ...item, position: spots.get(item.id) ?? { x: 0, y: 0 } })),
          )
      }
      if (fresh.length) {
        await tx
          .insert(candidates)
          .values(
            fresh.map((item) => ({ ...item, episodeId, organizationId: task.organizationId })),
          )
      }
    })
  }
}
