import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { toNodeHandler } from 'better-auth/node'
import { AppModule } from './app.module'
import type { Env } from './config/env'
import { AUTH, type Auth } from './modules/auth/auth'

const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false })
const server = app.getHttpAdapter().getInstance()

server.all('/api/auth/{*splat}', toNodeHandler(app.get<Auth>(AUTH)))
server.set('json replacer', (_key: string, value: unknown) => (value === null ? undefined : value))

app.useBodyParser('json')
app.setGlobalPrefix('api')
app.enableShutdownHooks()

await app.listen(app.get<ConfigService<Env, true>>(ConfigService).get('PORT', { infer: true }))
