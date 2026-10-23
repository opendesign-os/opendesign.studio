import { Inject, Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import type { TaskKind, TaskRequest } from '@opendesign/models'
import { slotLabel, viewLabel } from '@opendesign/models'
import { assets, episodes, series, shots, tasks } from '@opendesign/schemas'
import { desc, eq, getTableColumns, sql } from 'drizzle-orm'
import { fromDrizzle, PgBoss } from 'pg-boss'
import type { Database } from '../../common/database/database.module'
import { one, owned } from '../../common/database/query'
import { ProvidersService } from '../providers/providers.service'
import { lanes } from './queues'

const fields = {
  ...getTableColumns(tasks),
  elapsed:
    sql<number>`coalesce(extract(epoch from coalesce(${tasks.finishedAt}, now()) - ${tasks.startedAt})::int, 0)`.mapWith(
      Number,
    ),
}

type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]

type Schedule = { concurrency: number; retries: number }

@Injectable()
export class TasksService {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    @Inject(PgBoss) private readonly boss: PgBoss,
    private readonly providers: ProvidersService,
  ) {}

  list(tenant: string) {
    return this.db
      .select(fields)
      .from(tasks)
      .where(eq(tasks.organizationId, tenant))
      .orderBy(desc(tasks.createdAt))
  }

  find(tenant: string, id: string) {
    return one(
      this.db
        .select(fields)
        .from(tasks)
        .where(owned(tasks, id, tenant)),
      '任务',
    )
  }

  async create(tenant: string, request: TaskRequest) {
    const settings = await this.settings(tenant, request.kind)
    const target = await this.target(tenant, request)
    const id = await this.db.transaction(async (tx) => {
      const created = await one(
        tx
          .insert(tasks)
          .values({
            ...target,
            organizationId: tenant,
            kind: request.kind,
            request,
            model: settings?.active ?? 'ffmpeg',
          })
          .returning({ id: tasks.id }),
        '任务',
      )
      await this.enqueue(tx, tenant, created.id, request.kind, settings)
      return created.id
    })
    return this.find(tenant, id)
  }

  async retry(tenant: string, id: string) {
    const task = await this.find(tenant, id)
    const settings = await this.settings(tenant, task.kind)
    await this.db.transaction(async (tx) => {
      await tx
        .update(tasks)
        .set({ status: 'queued', progress: 0, error: null, startedAt: null, finishedAt: null })
        .where(owned(tasks, id, tenant))
      await this.boss.deleteJob(lanes[task.kind], id, { db: fromDrizzle(tx, sql) })
      await this.enqueue(tx, tenant, id, task.kind, settings)
    })
    return this.find(tenant, id)
  }

  async remove(tenant: string, id: string) {
    const removed = await one(
      this.db
        .delete(tasks)
        .where(owned(tasks, id, tenant))
        .returning(),
      '任务',
    )
    await this.boss.cancel(lanes[removed.kind], id).catch(() => undefined)
    return removed
  }

  private settings(tenant: string, kind: TaskKind) {
    const lane = lanes[kind]
    return lane === 'compose' ? undefined : this.providers.find(tenant, lane)
  }

  private async enqueue(
    tx: Transaction,
    tenant: string,
    id: string,
    kind: TaskKind,
    settings?: Schedule,
  ) {
    await this.boss.send(
      lanes[kind],
      { taskId: id },
      {
        id,
        db: fromDrizzle(tx, sql),
        group: { id: tenant, tier: String(settings?.concurrency ?? 1) },
        retryLimit: settings?.retries ?? 0,
        retryBackoff: true,
      },
    )
  }

  private async target(tenant: string, request: TaskRequest) {
    if (request.kind === 'image') {
      const asset = await one(
        this.db
          .select({ name: assets.name, seriesId: assets.seriesId })
          .from(assets)
          .where(owned(assets, request.assetId, tenant)),
        '资产',
      )
      return {
        title: `${asset.name} · ${viewLabel[request.view]}参考图`,
        seriesId: asset.seriesId,
      }
    }

    if (request.kind === 'script' || request.kind === 'compose') {
      const episode = await one(
        this.db
          .select({
            id: episodes.id,
            index: episodes.index,
            seriesId: series.id,
            name: series.title,
          })
          .from(episodes)
          .innerJoin(series, eq(series.id, episodes.seriesId))
          .where(owned(episodes, request.episodeId, tenant)),
        '分集',
      )
      return {
        title:
          request.kind === 'script'
            ? `第 ${episode.index} 集 · 剧本拆解`
            : `${episode.name} 第 ${episode.index} 集`,
        seriesId: episode.seriesId,
        episodeId: episode.id,
      }
    }

    const shot = await one(
      this.db
        .select({
          id: shots.id,
          index: shots.index,
          scene: shots.scene,
          episodeId: shots.episodeId,
          seriesId: episodes.seriesId,
        })
        .from(shots)
        .innerJoin(episodes, eq(episodes.id, shots.episodeId))
        .where(owned(shots, request.shotId, tenant)),
      '镜头',
    )
    const base = { seriesId: shot.seriesId, episodeId: shot.episodeId, shotId: shot.id }
    if (request.kind === 'keyframe') {
      return { ...base, title: `镜 ${shot.index} · ${slotLabel[request.slot]}` }
    }
    if (request.kind === 'video') return { ...base, title: `镜 ${shot.index} · ${shot.scene}` }
    return { ...base, title: `镜 ${shot.index} · 配音` }
  }
}
