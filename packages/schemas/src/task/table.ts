import type { TaskRequest } from '@opendesign/models'
import { taskKind, taskStatus } from '@opendesign/models'
import { index, integer, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { tenant } from '../auth/table'
import { choice, createTable } from '../common/table'
import { episodes, series } from '../series/table'
import { shots } from '../shot/table'

export const tasks = createTable(
  'tasks',
  {
    organizationId: tenant(),
    kind: choice('kind', taskKind.options).notNull(),
    status: choice('status', taskStatus.options).notNull().default('queued'),
    title: text('title').notNull(),
    request: jsonb('request').$type<TaskRequest>().notNull(),
    seriesId: uuid('series_id')
      .notNull()
      .references(() => series.id, { onDelete: 'cascade' }),
    episodeId: uuid('episode_id').references(() => episodes.id, { onDelete: 'cascade' }),
    shotId: uuid('shot_id').references(() => shots.id, { onDelete: 'cascade' }),
    model: text('model').notNull().default(''),
    progress: integer('progress').notNull().default(0),
    error: text('error'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (table) => [index('tasks_organization_idx').on(table.organizationId, table.createdAt)],
)
