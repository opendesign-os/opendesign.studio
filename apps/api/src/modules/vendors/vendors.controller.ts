import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common'
import { type VendorDraft, type VendorPatch, vendorDraft, vendorPatch } from '@opendesign/models'
import { Id } from '../../common/decorators/id.decorator'
import { Tenant } from '../auth/tenant.decorator'
import { VendorsService } from './vendors.service'

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Get()
  list(@Tenant() tenant: string) {
    return this.vendors.list(tenant)
  }

  @Post()
  create(@Tenant() tenant: string, @Body({ schema: vendorDraft }) draft: VendorDraft) {
    return this.vendors.create(tenant, draft)
  }

  @Patch(':id')
  update(
    @Tenant() tenant: string,
    @Id() id: string,
    @Body({ schema: vendorPatch }) patch: VendorPatch,
  ) {
    return this.vendors.update(tenant, id, patch)
  }

  @Delete(':id')
  remove(@Tenant() tenant: string, @Id() id: string) {
    return this.vendors.remove(tenant, id)
  }

  @Get(':id/models')
  models(@Tenant() tenant: string, @Id() id: string) {
    return this.vendors.models(tenant, id)
  }
}
