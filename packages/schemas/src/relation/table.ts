import { relationKind } from '@opendesign/models'
import { boolean, index, text, uuid } from 'drizzle-orm/pg-core'
import { assets } from '../asset/table'
import { tenant } from '../auth/table'
import { choice, createTable } from '../common/table'
import { series } from '../series/table'

export const relations = createTable(
  'relations',
  {
    organizationId: tenant(),
    seriesId: uuid('series_id')
      .notNull()
      .references(() => series.id, { onDelete: 'cascade' }),
    from: uuid('from')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    to: uuid('to')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    kind: choice('kind', relationKind.options).notNull(),
    mutual: boolean('mutual').notNull().default(true),
    label: text('label').notNull().default(''),
    note: text('note').notNull().default(''),
  },
  (table) => [index('relations_series_idx').on(table.seriesId)],
)
