import { Body, Controller, Get, Patch, Post } from '@nestjs/common'
import { type SeriesDraft, type SeriesPatch, seriesDraft, seriesPatch } from '@opendesign/models'
import { Id } from '../../common/decorators/id.decorator'
import { Tenant } from '../auth/tenant.decorator'
import { SeriesService } from './series.service'

@Controller('series')
export class SeriesController {
  constructor(private readonly series: SeriesService) {}

  @Get()
  list(@Tenant() tenant: string) {
    return this.series.list(tenant)
  }

  @Post()
  create(@Tenant() tenant: string, @Body({ schema: seriesDraft }) draft: SeriesDraft) {
    return this.series.create(tenant, draft)
  }

  @Get(':id')
  find(@Tenant() tenant: string, @Id() id: string) {
    return this.series.find(tenant, id)
  }

  @Patch(':id')
  update(
    @Tenant() tenant: string,
    @Id() id: string,
    @Body({ schema: seriesPatch }) patch: SeriesPatch,
  ) {
    return this.series.update(tenant, id, patch)
  }
}
