import { Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import type { SeriesDraft, SeriesPatch } from '@opendesign/models'
import { episodes, series } from '@opendesign/schemas'
import { desc, eq } from 'drizzle-orm'
import type { Database } from '../../common/database/database.module'
import { one, owned } from '../../common/database/query'

const palette = ['#4ba3d2', '#f5a623', '#9b7ede', '#e0795a', '#8fbf6a', '#d6719b']

@Injectable()
export class SeriesService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  list(tenant: string) {
    return this.db
      .select()
      .from(series)
      .where(eq(series.organizationId, tenant))
      .orderBy(desc(series.updatedAt))
  }

  find(tenant: string, id: string) {
    return one(
      this.db
        .select()
        .from(series)
        .where(owned(series, id, tenant)),
      '剧集',
    )
  }

  create(tenant: string, draft: SeriesDraft) {
    const color = palette[Math.floor(Math.random() * palette.length)] ?? '#4ba3d2'
    return this.db.transaction(async (tx) => {
      const created = await one(
        tx
          .insert(series)
          .values({ ...draft, organizationId: tenant, color })
          .returning(),
        '剧集',
      )
      await tx
        .insert(episodes)
        .values({ organizationId: tenant, seriesId: created.id, index: 1, title: '未命名' })
      return created
    })
  }

  update(tenant: string, id: string, patch: SeriesPatch) {
    return one(
      this.db
        .update(series)
        .set(patch)
        .where(owned(series, id, tenant))
        .returning(),
      '剧集',
    )
  }
}
