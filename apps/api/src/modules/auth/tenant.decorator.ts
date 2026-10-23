import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { Incoming } from './auth'

export const Tenant = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<Incoming>().session?.session.activeOrganizationId,
)
