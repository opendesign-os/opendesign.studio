import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectDrizzle } from '@nestjs/drizzle'
import type { VendorDraft, VendorPatch } from '@opendesign/models'
import { vendors } from '@opendesign/schemas'
import { symmetricDecrypt, symmetricEncrypt } from 'better-auth/crypto'
import { asc, eq } from 'drizzle-orm'
import { FetchError } from 'ofetch'
import type { Database } from '../../common/database/database.module'
import { one, owned } from '../../common/database/query'
import type { Env } from '../../config/env'
import { catalog } from './protocols'

type Row = typeof vendors.$inferSelect

function reason(error: unknown) {
  if (!(error instanceof FetchError)) return '无法识别厂商返回的模型列表'
  if (error.status === 401 || error.status === 403) return '密钥无效或没有权限'
  if (error.status) return `厂商返回了 ${error.status} 错误`
  return '连不上厂商，请检查服务地址'
}

@Injectable()
export class VendorsService {
  private readonly secret: string

  constructor(
    @InjectDrizzle() private readonly db: Database,
    config: ConfigService<Env, true>,
  ) {
    this.secret = config.get('BETTER_AUTH_SECRET', { infer: true })
  }

  async list(tenant: string) {
    const rows = await this.db
      .select()
      .from(vendors)
      .where(eq(vendors.organizationId, tenant))
      .orderBy(asc(vendors.createdAt))
    return Promise.all(rows.map((row) => this.present(row)))
  }

  async create(tenant: string, draft: VendorDraft) {
    const row = await one(
      this.db
        .insert(vendors)
        .values({ ...draft, key: await this.seal(draft.key), organizationId: tenant })
        .returning(),
      '厂商',
    )
    return this.present(row)
  }

  async update(tenant: string, id: string, patch: VendorPatch) {
    const values = patch.key === undefined ? patch : { ...patch, key: await this.seal(patch.key) }
    const row = await one(
      this.db
        .update(vendors)
        .set(values)
        .where(owned(vendors, id, tenant))
        .returning(),
      '厂商',
    )
    return this.present(row)
  }

  async remove(tenant: string, id: string) {
    const row = await one(
      this.db
        .delete(vendors)
        .where(owned(vendors, id, tenant))
        .returning(),
      '厂商',
    )
    return this.present(row)
  }

  async read(tenant: string, id: string) {
    const row = await one(
      this.db
        .select()
        .from(vendors)
        .where(owned(vendors, id, tenant)),
      '厂商',
    )
    return { ...row, key: await this.reveal(row.key) }
  }

  async models(tenant: string, id: string) {
    const vendor = await this.read(tenant, id)
    if (!vendor.endpoint) throw new BadRequestException('先填写服务地址')
    return catalog(vendor).catch((error: unknown) => {
      throw new BadGatewayException(reason(error))
    })
  }

  private async seal(value: string) {
    return value ? symmetricEncrypt({ key: this.secret, data: value }) : ''
  }

  private async reveal(value: string) {
    return value ? symmetricDecrypt({ key: this.secret, data: value }).catch(() => '') : ''
  }

  private async present(row: Row) {
    const key = await this.reveal(row.key)
    return { ...row, key: key && `••••${key.slice(-4)}` }
  }
}
