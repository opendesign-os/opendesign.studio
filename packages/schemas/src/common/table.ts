import { AsyncLocalStorage } from 'node:async_hooks'
import { type BuildExtraConfigColumns, sql } from 'drizzle-orm'
import type { PgColumnBuilderBase, PgTableExtraConfigValue } from 'drizzle-orm/pg-core'
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const actor = new AsyncLocalStorage<string>()

function current() {
  return actor.getStore() ?? sql`null`
}

function key() {
  return uuid('id').primaryKey().defaultRandom()
}

function audit() {
  return {
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by').$defaultFn(current),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    updatedBy: uuid('updated_by').$defaultFn(current).$onUpdate(current),
  }
}

type Columns = { id: ReturnType<typeof key> } & ReturnType<typeof audit>

export function createTable<
  TName extends string,
  TShape extends Record<string, PgColumnBuilderBase>,
>(
  name: TName,
  shape: TShape,
  extra?: (
    table: BuildExtraConfigColumns<TName, Columns & TShape, 'pg'>,
  ) => PgTableExtraConfigValue[],
) {
  return pgTable<TName, Columns & TShape>(name, { id: key(), ...shape, ...audit() }, extra)
}

export function choice<T extends string>(name: string, values: readonly T[]) {
  return text(name, { enum: values as [T, ...T[]] })
}
