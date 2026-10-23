import { NotFoundException } from '@nestjs/common'
import { type AnyColumn, and, eq } from 'drizzle-orm'

export function owned(
  table: { id: AnyColumn; organizationId: AnyColumn },
  id: string,
  tenant: string,
) {
  return and(eq(table.id, id), eq(table.organizationId, tenant))
}

export async function one<T>(query: PromiseLike<T[]>, name: string) {
  const [row] = await query
  if (!row) throw new NotFoundException(`找不到${name}`)
  return row
}
