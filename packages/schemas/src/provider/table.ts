import type { Setting } from '@opendesign/models'
import { providerKind } from '@opendesign/models'
import { integer, jsonb, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { tenant } from '../auth/table'
import { choice, createTable } from '../common/table'
import { vendors } from '../vendor/table'

export const providers = createTable(
  'providers',
  {
    organizationId: tenant(),
    kind: choice('kind', providerKind.options).notNull(),
    vendorId: uuid('vendor_id').references(() => vendors.id, { onDelete: 'set null' }),
    active: text('active').notNull().default(''),
    fallback: text('fallback').notNull().default(''),
    concurrency: integer('concurrency').notNull().default(4),
    retries: integer('retries').notNull().default(2),
    params: jsonb('params').$type<Record<string, Setting>>().notNull().default({}),
  },
  (table) => [uniqueIndex('providers_kind_idx').on(table.organizationId, table.kind)],
)
