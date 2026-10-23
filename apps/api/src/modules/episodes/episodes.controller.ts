import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common'
import { type EpisodePatch, episodeDraft, episodePatch } from '@opendesign/models'
import { z } from 'zod'
import { Id } from '../../common/decorators/id.decorator'
import { Tenant } from '../auth/tenant.decorator'
import { EpisodesService } from './episodes.service'

const input = episodeDraft.extend({ seriesId: z.uuid() })

@Controller('episodes')
export class EpisodesController {
  constructor(private readonly episodes: EpisodesService) {}

  @Get()
  list(
    @Tenant() tenant: string,
    @Query('seriesId', { schema: z.uuid().optional() }) seriesId?: string,
  ) {
    return this.episodes.list(tenant, seriesId)
  }

  @Post()
  create(@Tenant() tenant: string, @Body({ schema: input }) draft: z.infer<typeof input>) {
    return this.episodes.create(tenant, draft)
  }

  @Get(':id')
  find(@Tenant() tenant: string, @Id() id: string) {
    return this.episodes.find(tenant, id)
  }

  @Patch(':id')
  update(
    @Tenant() tenant: string,
    @Id() id: string,
    @Body({ schema: episodePatch }) patch: EpisodePatch,
  ) {
    return this.episodes.update(tenant, id, patch)
  }
}
