import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import type { Incoming } from './auth'

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const { session } = context.switchToHttp().getRequest<Incoming>()
    if (!session) throw new UnauthorizedException('请先登录')
    if (!session.session.activeOrganizationId) throw new ForbiddenException('请先加入团队')
    return true
  }
}
