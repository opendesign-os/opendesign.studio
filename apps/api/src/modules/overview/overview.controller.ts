import { Controller, Get } from '@nestjs/common'
import { Tenant } from '../auth/tenant.decorator'
import { OverviewService } from './overview.service'

@Controller('overview')
export class OverviewController {
  constructor(private readonly overview: OverviewService) {}

  @Get()
  read(@Tenant() tenant: string) {
    return this.overview.read(tenant)
  }
}
