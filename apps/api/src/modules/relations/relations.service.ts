import { Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import type { RelationDraft, RelationPatch } from '@opendesign/models'
import { relations, series } from '@opendesign/schemas'
import { and, asc, eq } from 'drizzle-orm'
import type { Database } from '../../common/database/database.module'
import { one, owned } from '../../common/database/query'

@Injectable()
export class RelationsService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  list(tenant: string, seriesId: string) {
    return this.db
      .select()
      .from(relations)
      .where(and(eq(relations.organizationId, tenant), eq(relations.seriesId, seriesId)))
      .orderBy(asc(relations.createdAt))
  }

  async create(tenant: string, draft: RelationDraft & { seriesId: string }) {
    await one(
      this.db
        .select({ id: series.id })
        .from(series)
        .where(owned(series, draft.seriesId, tenant)),
      '剧集',
    )
    return one(
      this.db
        .insert(relations)
        .values({ ...draft, organizationId: tenant })
        .returning(),
      '关系',
    )
  }

  update(tenant: string, id: string, patch: RelationPatch) {
    return one(
      this.db
        .update(relations)
        .set(patch)
        .where(owned(relations, id, tenant))
        .returning(),
      '关系',
    )
  }

  remove(tenant: string, id: string) {
    return one(
      this.db
        .delete(relations)
        .where(owned(relations, id, tenant))
        .returning(),
      '关系',
    )
  }
}
