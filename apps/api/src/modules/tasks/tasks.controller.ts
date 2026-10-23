import { Body, Controller, Delete, Get, Post } from '@nestjs/common'
import { type TaskRequest, taskRequest } from '@opendesign/models'
import { Id } from '../../common/decorators/id.decorator'
import { Tenant } from '../auth/tenant.decorator'
import { TasksService } from './tasks.service'

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(@Tenant() tenant: string) {
    return this.tasks.list(tenant)
  }

  @Post()
  create(@Tenant() tenant: string, @Body({ schema: taskRequest }) request: TaskRequest) {
    return this.tasks.create(tenant, request)
  }

  @Post(':id/retry')
  retry(@Tenant() tenant: string, @Id() id: string) {
    return this.tasks.retry(tenant, id)
  }

  @Delete(':id')
  remove(@Tenant() tenant: string, @Id() id: string) {
    return this.tasks.remove(tenant, id)
  }
}
