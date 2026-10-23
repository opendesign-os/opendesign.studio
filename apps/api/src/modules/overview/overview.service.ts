import { Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import type { Overview } from '@opendesign/models'
import { assets, series, shots, tasks } from '@opendesign/schemas'
import { count, eq, inArray, type SQL, sql } from 'drizzle-orm'
import type { Database } from '../../common/database/database.module'

function tally(condition: SQL | undefined) {
  return sql<number>`count(*) filter (where ${condition})`.mapWith(Number)
}

@Injectable()
export class OverviewService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  async read(tenant: string): Promise<Overview> {
    const [[works], [cuts], [jobs], [kits]] = await Promise.all([
      this.db
        .select({ total: count(), producing: tally(eq(series.status, 'producing')) })
        .from(series)
        .where(eq(series.organizationId, tenant)),
      this.db
        .select({
          total: count(),
          blocked: tally(inArray(shots.status, ['draft', 'failed'])),
          review: tally(eq(shots.status, 'review')),
        })
        .from(shots)
        .where(eq(shots.organizationId, tenant)),
      this.db
        .select({
          running: tally(inArray(tasks.status, ['queued', 'running'])),
          failed: tally(eq(tasks.status, 'failed')),
        })
        .from(tasks)
        .where(eq(tasks.organizationId, tenant)),
      this.db
        .select({
          total: count(),
          loose: tally(
            sql`not (${assets.kind} = 'character' and ${assets.name} = '旁白') and not ${assets.references} @> '[{"locked": true}]'`,
          ),
        })
        .from(assets)
        .where(eq(assets.organizationId, tenant)),
    ])
    return {
      series: works?.total ?? 0,
      producing: works?.producing ?? 0,
      shots: cuts?.total ?? 0,
      blocked: cuts?.blocked ?? 0,
      review: cuts?.review ?? 0,
      running: jobs?.running ?? 0,
      failed: jobs?.failed ?? 0,
      assets: kits?.total ?? 0,
      loose: kits?.loose ?? 0,
    }
  }
}
