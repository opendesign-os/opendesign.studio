import { Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import type { AssetDraft, AssetPatch } from '@opendesign/models'
import { assets, series, shots } from '@opendesign/schemas'
import { and, asc, eq, sql } from 'drizzle-orm'
import type { Database } from '../../common/database/database.module'
import { one, owned } from '../../common/database/query'

@Injectable()
export class AssetsService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  list(tenant: string, seriesId: string) {
    return this.db
      .select()
      .from(assets)
      .where(and(eq(assets.organizationId, tenant), eq(assets.seriesId, seriesId)))
      .orderBy(asc(assets.createdAt))
  }

  async create(tenant: string, draft: AssetDraft & { seriesId: string }) {
    await one(
      this.db
        .select({ id: series.id })
        .from(series)
        .where(owned(series, draft.seriesId, tenant)),
      '剧集',
    )
    return one(
      this.db
        .insert(assets)
        .values({ ...draft, organizationId: tenant })
        .returning(),
      '资产',
    )
  }

  update(tenant: string, id: string, patch: AssetPatch) {
    return one(
      this.db
        .update(assets)
        .set(patch)
        .where(owned(assets, id, tenant))
        .returning(),
      '资产',
    )
  }

  remove(tenant: string, id: string) {
    return this.db.transaction(async (tx) => {
      const removed = await one(
        tx
          .delete(assets)
          .where(owned(assets, id, tenant))
          .returning(),
        '资产',
      )
      await tx
        .update(shots)
        .set({ cast: sql`${shots.cast} - ${id}::text` })
        .where(and(eq(shots.organizationId, tenant), sql`${shots.cast} ? ${id}::text`))
      return removed
    })
  }
}
