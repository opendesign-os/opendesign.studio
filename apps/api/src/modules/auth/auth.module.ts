import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { getDrizzleToken } from '@nestjs/drizzle'
import type { Database } from '../../common/database/database.module'
import type { Env } from '../../config/env'
import { AUTH, createAuth } from './auth'
import { AuthGuard } from './auth.guard'
import { AuthMiddleware } from './auth.middleware'

@Module({
  providers: [
    {
      provide: AUTH,
      inject: [getDrizzleToken(), ConfigService],
      useFactory: (db: Database, config: ConfigService<Env, true>) =>
        createAuth(db, {
          baseURL: config.get('BETTER_AUTH_URL', { infer: true }),
          secret: config.get('BETTER_AUTH_SECRET', { infer: true }),
        }),
    },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [AUTH],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*path')
  }
}
