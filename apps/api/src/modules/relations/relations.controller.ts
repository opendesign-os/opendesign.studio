import { Body, Controller, Delete, Get, Patch, Post, Query } from '@nestjs/common'
import { type RelationPatch, relationDraft, relationPatch } from '@opendesign/models'
import { z } from 'zod'
import { Id } from '../../common/decorators/id.decorator'
import { Tenant } from '../auth/tenant.decorator'
import { RelationsService } from './relations.service'

const input = relationDraft.extend({ seriesId: z.uuid(), from: z.uuid(), to: z.uuid() })

@Controller('relations')
export class RelationsController {
  constructor(private readonly relations: RelationsService) {}

  @Get()
  list(@Tenant() tenant: string, @Query('seriesId', { schema: z.uuid() }) seriesId: string) {
    return this.relations.list(tenant, seriesId)
  }

  @Post()
  create(@Tenant() tenant: string, @Body({ schema: input }) draft: z.infer<typeof input>) {
    return this.relations.create(tenant, draft)
  }

  @Patch(':id')
  update(
    @Tenant() tenant: string,
    @Id() id: string,
    @Body({ schema: relationPatch }) patch: RelationPatch,
  ) {
    return this.relations.update(tenant, id, patch)
  }

  @Delete(':id')
  remove(@Tenant() tenant: string, @Id() id: string) {
    return this.relations.remove(tenant, id)
  }
}
