import type {
  Bubble,
  Dialogue,
  Effect,
  Keyframe,
  Layer,
  Move,
  Point,
  Sound,
} from '@opendesign/models'
import { shotSize, shotStatus, transition } from '@opendesign/models'
import { index, integer, jsonb, real, text, uuid } from 'drizzle-orm/pg-core'
import { tenant } from '../auth/table'
import { choice, createTable } from '../common/table'
import { episodes } from '../series/table'

export const shots = createTable(
  'shots',
  {
    organizationId: tenant(),
    episodeId: uuid('episode_id')
      .notNull()
      .references(() => episodes.id, { onDelete: 'cascade' }),
    index: integer('index').notNull(),
    scene: text('scene').notNull(),
    size: choice('size', shotSize.options).notNull(),
    move: jsonb('move').$type<Move>().notNull(),
    layers: jsonb('layers').$type<Layer[]>().notNull(),
    prompt: text('prompt').notNull(),
    cast: jsonb('cast').$type<string[]>().notNull().default([]),
    keyframes: jsonb('keyframes').$type<Keyframe[]>().notNull(),
    dialogue: jsonb('dialogue').$type<Dialogue[]>().notNull().default([]),
    bubbles: jsonb('bubbles').$type<Bubble[]>().notNull().default([]),
    effects: jsonb('effects').$type<Effect[]>().notNull().default([]),
    sounds: jsonb('sounds').$type<Sound[]>().notNull().default([]),
    transition: choice('transition', transition.options).notNull().default('cut'),
    duration: real('duration').notNull(),
    status: choice('status', shotStatus.options).notNull().default('draft'),
    note: text('note').notNull().default(''),
    position: jsonb('position').$type<Point>().notNull(),
    video: text('video'),
  },
  (table) => [index('shots_episode_idx').on(table.episodeId)],
)
