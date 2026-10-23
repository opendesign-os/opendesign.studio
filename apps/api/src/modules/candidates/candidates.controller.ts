import { Controller, Delete, Get, Post, Query } from '@nestjs/common'
import { z } from 'zod'
import { Id } from '../../common/decorators/id.decorator'
import { Tenant } from '../auth/tenant.decorator'
import { CandidatesService } from './candidates.service'

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidates: CandidatesService) {}

  @Get()
  list(@Tenant() tenant: string, @Query('episodeId', { schema: z.uuid() }) episodeId: string) {
    return this.candidates.list(tenant, episodeId)
  }

  @Post(':id/accept')
  accept(@Tenant() tenant: string, @Id() id: string) {
    return this.candidates.accept(tenant, id)
  }

  @Delete(':id')
  remove(@Tenant() tenant: string, @Id() id: string) {
    return this.candidates.remove(tenant, id)
  }
}
