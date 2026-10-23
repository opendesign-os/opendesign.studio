import { Body, Controller, Get, Param, Patch } from '@nestjs/common'
import {
  type ProviderKind,
  type ProviderPatch,
  providerKind,
  providerPatch,
} from '@opendesign/models'
import { Tenant } from '../auth/tenant.decorator'
import { ProvidersService } from './providers.service'

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  @Get()
  list(@Tenant() tenant: string) {
    return this.providers.list(tenant)
  }

  @Patch(':kind')
  update(
    @Tenant() tenant: string,
    @Param('kind', { schema: providerKind }) kind: ProviderKind,
    @Body({ schema: providerPatch }) patch: ProviderPatch,
  ) {
    return this.providers.update(tenant, kind, patch)
  }
}
