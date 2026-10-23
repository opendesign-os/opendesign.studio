import { Body, Controller, Delete, Get, Patch, Post, Query } from '@nestjs/common'
import { type AssetPatch, assetDraft, assetPatch } from '@opendesign/models'
import { z } from 'zod'
import { Id } from '../../common/decorators/id.decorator'
import { Tenant } from '../auth/tenant.decorator'
import { AssetsService } from './assets.service'

const input = assetDraft.extend({ seriesId: z.uuid() })

@Controller('assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Get()
  list(@Tenant() tenant: string, @Query('seriesId', { schema: z.uuid() }) seriesId: string) {
    return this.assets.list(tenant, seriesId)
  }

  @Post()
  create(@Tenant() tenant: string, @Body({ schema: input }) draft: z.infer<typeof input>) {
    return this.assets.create(tenant, draft)
  }

  @Patch(':id')
  update(
    @Tenant() tenant: string,
    @Id() id: string,
    @Body({ schema: assetPatch }) patch: AssetPatch,
  ) {
    return this.assets.update(tenant, id, patch)
  }

  @Delete(':id')
  remove(@Tenant() tenant: string, @Id() id: string) {
    return this.assets.remove(tenant, id)
  }
}
