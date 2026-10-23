import { Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import type { EpisodeDraft, EpisodePatch, EpisodeStatus } from '@opendesign/models'
import { episodes, series, shots } from '@opendesign/schemas'
import { and, asc, eq, getTableColumns, max, type SQL, sql } from 'drizzle-orm'
import type { Database } from '../../common/database/database.module'
import { one, owned } from '../../common/database/query'

const fields = {
  ...getTableColumns(episodes),
  shots: sql<number>`count(${shots.id})`.mapWith(Number),
  done: sql<number>`count(${shots.id}) filter (where ${shots.status} = 'composed')`.mapWith(Number),
  duration: sql<number>`coalesce(round(sum(${shots.duration})), 0)`.mapWith(Number),
}

function status(row: { script: string; shots: number; done: number }): EpisodeStatus {
  if (!row.shots) return row.script ? 'parsing' : 'draft'
  return row.done === row.shots ? 'done' : 'producing'
}

@Injectable()
export class EpisodesService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  list(tenant: string, seriesId?: string) {
    return this.query(
      and(
        eq(episodes.organizationId, tenant),
        seriesId ? eq(episodes.seriesId, seriesId) : undefined,
      ),
    )
  }

  find(tenant: string, id: string) {
    return one(this.query(owned(episodes, id, tenant)), '分集')
  }

  async create(tenant: string, draft: EpisodeDraft & { seriesId: string }) {
    const id = await this.db.transaction(async (tx) => {
      await one(
        tx
          .select({ id: series.id })
          .from(series)
          .where(owned(series, draft.seriesId, tenant)),
        '剧集',
      )
      const [last] = await tx
        .select({ index: max(episodes.index) })
        .from(episodes)
        .where(eq(episodes.seriesId, draft.seriesId))
      const created = await one(
        tx
          .insert(episodes)
          .values({ ...draft, organizationId: tenant, index: (last?.index ?? 0) + 1 })
          .returning({ id: episodes.id }),
        '分集',
      )
      return created.id
    })
    return this.find(tenant, id)
  }

  async update(tenant: string, id: string, patch: EpisodePatch) {
    await one(
      this.db
        .update(episodes)
        .set(patch)
        .where(owned(episodes, id, tenant))
        .returning({ id: episodes.id }),
      '分集',
    )
    return this.find(tenant, id)
  }

  private async query(where: SQL | undefined) {
    const rows = await this.db
      .select(fields)
      .from(episodes)
      .leftJoin(shots, eq(shots.episodeId, episodes.id))
      .where(where)
      .groupBy(episodes.id)
      .orderBy(asc(episodes.index))
    return rows.map((row) => ({ ...row, status: status(row) }))
  }
}
