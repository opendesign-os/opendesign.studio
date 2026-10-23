import { Inject, Injectable, type NestMiddleware } from '@nestjs/common'
import { actor } from '@opendesign/schemas'
import { fromNodeHeaders } from 'better-auth/node'
import type { NextFunction, Response } from 'express'
import { AUTH, type Auth, type Incoming } from './auth'

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(@Inject(AUTH) private readonly auth: Auth) {}

  async use(request: Incoming, _response: Response, next: NextFunction) {
    const session = await this.auth.api.getSession({ headers: fromNodeHeaders(request.headers) })
    if (!session) return next()
    request.session = session
    actor.run(session.user.id, next)
  }
}
