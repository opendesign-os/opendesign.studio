import { preset, protocol } from '@opendesign/models'
import { index, text } from 'drizzle-orm/pg-core'
import { tenant } from '../auth/table'
import { choice, createTable } from '../common/table'

export const vendors = createTable(
  'vendors',
  {
    organizationId: tenant(),
    preset: choice('preset', preset.options),
    name: text('name').notNull(),
    protocol: choice('protocol', protocol.options).notNull(),
    endpoint: text('endpoint').notNull().default(''),
    key: text('key').notNull().default(''),
  },
  (table) => [index('vendors_organization_idx').on(table.organizationId)],
)
