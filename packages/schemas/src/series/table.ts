import { aspect, seriesStatus } from '@opendesign/models'
import { index, integer, jsonb, text, uuid } from 'drizzle-orm/pg-core'
import { tenant } from '../auth/table'
import { choice, createTable } from '../common/table'

export const series = createTable(
  'series',
  {
    organizationId: tenant(),
    title: text('title').notNull(),
    aspect: choice('aspect', aspect.options).notNull(),
    synopsis: text('synopsis').notNull().default(''),
    outline: text('outline').notNull().default(''),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    status: choice('status', seriesStatus.options).notNull().default('writing'),
    color: text('color').notNull(),
  },
  (table) => [index('series_organization_idx').on(table.organizationId)],
)

export const episodes = createTable(
  'episodes',
  {
    organizationId: tenant(),
    seriesId: uuid('series_id')
      .notNull()
      .references(() => series.id, { onDelete: 'cascade' }),
    index: integer('index').notNull(),
    title: text('title').notNull(),
    hook: text('hook').notNull().default(''),
    script: text('script').notNull().default(''),
    output: text('output'),
  },
  (table) => [index('episodes_series_idx').on(table.seriesId)],
)
