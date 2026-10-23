import type { Reference } from '@opendesign/models'
import { assetKind, role, voice } from '@opendesign/models'
import { index, integer, jsonb, text, uuid } from 'drizzle-orm/pg-core'
import { tenant } from '../auth/table'
import { choice, createTable } from '../common/table'
import { episodes, series } from '../series/table'

export const assets = createTable(
  'assets',
  {
    organizationId: tenant(),
    seriesId: uuid('series_id')
      .notNull()
      .references(() => series.id, { onDelete: 'cascade' }),
    kind: choice('kind', assetKind.options).notNull(),
    name: text('name').notNull(),
    summary: text('summary').notNull().default(''),
    prompt: text('prompt').notNull(),
    color: text('color').notNull(),
    references: jsonb('references').$type<Reference[]>().notNull().default([]),
    role: choice('role', role.options),
    voice: choice('voice', voice.options),
  },
  (table) => [index('assets_series_idx').on(table.seriesId)],
)

export const candidates = createTable(
  'candidates',
  {
    organizationId: tenant(),
    episodeId: uuid('episode_id')
      .notNull()
      .references(() => episodes.id, { onDelete: 'cascade' }),
    kind: choice('kind', assetKind.options).notNull(),
    name: text('name').notNull(),
    prompt: text('prompt').notNull(),
    mentions: integer('mentions').notNull().default(1),
  },
  (table) => [index('candidates_episode_idx').on(table.episodeId)],
)
