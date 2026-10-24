import { Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import type { TaskRequest } from '@opendesign/models'
import { live } from '@opendesign/models'
import { assets, candidates, episodes, shots, tasks } from '@opendesign/schemas'
import { asc, eq, inArray } from 'drizzle-orm'
import type { Database } from '../../../common/database/database.module'
import { CandidatesService } from '../../candidates/candidates.service'
import { TasksService } from '../tasks.service'
import type { Context, Job } from './context'

const POLL = 2000

type Stage = { label: string; requests: TaskRequest[] }

@Injectable()
export class EpisodeJob implements Job {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly candidates: CandidatesService,
    private readonly tasks: TasksService,
  ) {}

  async run({ task, signal, progress }: Context) {
    if (task.request.kind !== 'episode') throw new Error('任务类型不匹配')
    const { episodeId } = task.request
    const tenant = task.organizationId
    const [episode] = await this.db.select().from(episodes).where(eq(episodes.id, episodeId))
    if (!episode) throw new Error('分集不存在')

    await this.adopt(tenant, episodeId)
    const stages: Stage[] = [
      { label: '参考图', requests: await this.references(episode.seriesId, episodeId) },
      { label: '关键帧', requests: await this.keyframes(episodeId) },
      { label: '视频', requests: await this.videos(episodeId) },
      { label: '合成', requests: [{ kind: 'compose', episodeId }] },
    ]
    const total = stages.reduce((count, stage) => count + stage.requests.length, 0)

    let done = 0
    for (const stage of stages) {
      if (!stage.requests.length) continue
      const children = await Promise.all(
        stage.requests.map((request) => this.tasks.create(tenant, request)),
      )
      await this.settle(
        children.map((child) => child.id),
        stage.label,
        signal,
        (finished) => progress(((done + finished) / total) * 100),
      )
      done += stage.requests.length
    }
  }

  private async adopt(tenant: string, episodeId: string) {
    const rows = await this.db.select().from(candidates).where(eq(candidates.episodeId, episodeId))
    for (const row of rows.filter((item) => item.kind === 'character')) {
      const asset = await this.candidates.accept(tenant, row.id)
      const members = await this.db.select().from(shots).where(eq(shots.episodeId, episodeId))
      for (const shot of members.filter((item) => item.prompt.includes(asset.name))) {
        if (shot.cast.includes(asset.id)) continue
        await this.db
          .update(shots)
          .set({ cast: [...shot.cast, asset.id] })
          .where(eq(shots.id, shot.id))
      }
    }
  }

  private async references(seriesId: string, episodeId: string) {
    const members = await this.db.select().from(shots).where(eq(shots.episodeId, episodeId))
    const booked = new Set(members.flatMap((shot) => shot.cast))
    if (!booked.size) return []
    const roster = await this.db
      .select()
      .from(assets)
      .where(inArray(assets.id, [...booked]))
    return roster
      .filter((item) => item.seriesId === seriesId && !item.references.some((entry) => entry.image))
      .map((item): TaskRequest => ({ kind: 'image', assetId: item.id, view: 'front' }))
  }

  private async keyframes(episodeId: string) {
    const members = await this.db
      .select()
      .from(shots)
      .where(eq(shots.episodeId, episodeId))
      .orderBy(asc(shots.index))
    return members.flatMap((shot) =>
      shot.video
        ? []
        : (['first', 'last'] as const)
            .filter((slot) => !shot.keyframes.find((item) => item.slot === slot)?.image)
            .map((slot): TaskRequest => ({ kind: 'keyframe', shotId: shot.id, slot })),
    )
  }

  private async videos(episodeId: string) {
    const members = await this.db
      .select()
      .from(shots)
      .where(eq(shots.episodeId, episodeId))
      .orderBy(asc(shots.index))
    return members
      .filter((shot) => !shot.video)
      .map((shot): TaskRequest => ({ kind: 'video', shotId: shot.id }))
  }

  private async settle(
    ids: string[],
    label: string,
    signal: AbortSignal,
    report: (finished: number) => Promise<void>,
  ) {
    for (;;) {
      signal.throwIfAborted()
      const rows = await this.db
        .select({ status: tasks.status, title: tasks.title, error: tasks.error })
        .from(tasks)
        .where(inArray(tasks.id, ids))
      const failed = rows.find((row) => row.status === 'failed')
      if (failed) throw new Error(`${label}「${failed.title}」失败：${failed.error ?? '未知原因'}`)
      const pending = rows.filter((row) => live(row.status))
      await report(rows.length - pending.length)
      if (!pending.length) return
      await new Promise((resolve) => setTimeout(resolve, POLL))
    }
  }
}
