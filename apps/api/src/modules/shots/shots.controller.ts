import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common'
import { type ShotPatch, shotPatch } from '@opendesign/models'
import { z } from 'zod'
import { Id } from '../../common/decorators/id.decorator'
import { Tenant } from '../auth/tenant.decorator'
import { ShotsService } from './shots.service'

@Controller('shots')
export class ShotsController {
  constructor(private readonly shots: ShotsService) {}

  @Get()
  list(@Tenant() tenant: string, @Query('episodeId', { schema: z.uuid() }) episodeId: string) {
    return this.shots.list(tenant, episodeId)
  }

  @Patch(':id')
  update(
    @Tenant() tenant: string,
    @Id() id: string,
    @Body({ schema: shotPatch }) patch: ShotPatch,
  ) {
    return this.shots.update(tenant, id, patch)
  }

  @Post(':id/split')
  split(
    @Tenant() tenant: string,
    @Id() id: string,
    @Body('at', { schema: z.number().positive() }) at: number,
  ) {
    return this.shots.split(tenant, id, at)
  }
}
