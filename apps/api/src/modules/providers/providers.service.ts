import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import type { ProviderKind, ProviderPatch } from '@opendesign/models'
import { defaults, providerKind, providerLabel, schedule, supports } from '@opendesign/models'
import { providers } from '@opendesign/schemas'
import { and, eq } from 'drizzle-orm'
import type { Database } from '../../common/database/database.module'
import { one } from '../../common/database/query'
import { VendorsService } from '../vendors/vendors.service'

function fresh(kind: ProviderKind) {
  return {
    kind,
    vendorId: null,
    active: '',
    fallback: '',
    ...schedule,
    params: defaults(kind),
  }
}

export type Settings = Awaited<ReturnType<ProvidersService['read']>>

@Injectable()
export class ProvidersService {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly vendors: VendorsService,
  ) {}

  async list(tenant: string) {
    const rows = await this.db.select().from(providers).where(eq(providers.organizationId, tenant))
    return providerKind.options.map((kind) => ({
      ...(rows.find((row) => row.kind === kind) ?? fresh(kind)),
      id: kind,
    }))
  }

  async find(tenant: string, kind: ProviderKind) {
    const [row] = await this.db
      .select()
      .from(providers)
      .where(and(eq(providers.organizationId, tenant), eq(providers.kind, kind)))
    return row ?? fresh(kind)
  }

  async read(tenant: string, kind: ProviderKind) {
    const provider = await this.find(tenant, kind)
    if (!provider.vendorId) {
      throw new Error(`「${providerLabel[kind]}」还没有选择厂商，请到设置里配置`)
    }
    if (!provider.active) {
      throw new Error(`「${providerLabel[kind]}」还没有选择模型，请到设置里配置`)
    }
    const { protocol, endpoint, key } = await this.vendors.read(tenant, provider.vendorId)
    return { ...provider, protocol, endpoint, key }
  }

  async update(tenant: string, kind: ProviderKind, patch: ProviderPatch) {
    if (patch.vendorId && !supports(await this.vendors.read(tenant, patch.vendorId), kind)) {
      throw new BadRequestException('这个厂商不支持该能力')
    }
    const row = await one(
      this.db
        .insert(providers)
        .values({ ...fresh(kind), ...patch, organizationId: tenant })
        .onConflictDoUpdate({
          target: [providers.organizationId, providers.kind],
          set: { ...patch, updatedAt: new Date() },
        })
        .returning(),
      '模型配置',
    )
    return { ...row, id: kind }
  }
}
