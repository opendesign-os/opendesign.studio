import { Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import { assets, candidates, episodes } from '@opendesign/schemas'
import { and, desc, eq } from 'drizzle-orm'
import type { Database } from '../../common/database/database.module'
import { one, owned } from '../../common/database/query'

@Injectable()
export class CandidatesService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  list(tenant: string, episodeId: string) {
    return this.db
      .select()
      .from(candidates)
      .where(and(eq(candidates.organizationId, tenant), eq(candidates.episodeId, episodeId)))
      .orderBy(desc(candidates.mentions))
  }

  accept(tenant: string, id: string) {
    return this.db.transaction(async (tx) => {
      const candidate = await one(
        tx
          .delete(candidates)
          .where(owned(candidates, id, tenant))
          .returning(),
        '候选资产',
      )
      const episode = await one(
        tx
          .select({ seriesId: episodes.seriesId })
          .from(episodes)
          .where(eq(episodes.id, candidate.episodeId)),
        '分集',
      )
      return one(
        tx
          .insert(assets)
          .values({
            organizationId: tenant,
            seriesId: episode.seriesId,
            kind: candidate.kind,
            name: candidate.name,
            prompt: candidate.prompt,
            color: '#7f8a94',
          })
          .returning(),
        '资产',
      )
    })
  }

  remove(tenant: string, id: string) {
    return one(
      this.db
        .delete(candidates)
        .where(owned(candidates, id, tenant))
        .returning(),
      '候选资产',
    )
  }
}
