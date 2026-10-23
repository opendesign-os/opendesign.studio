import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DrizzleModule } from '@nestjs/drizzle'
import * as schema from '@opendesign/schemas'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { Env } from '../../config/env'

export type Database = PostgresJsDatabase<typeof schema>

@Module({
  imports: [
    DrizzleModule.forRootAsync<typeof drizzle>({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        drizzle,
        connection: config.get('DATABASE_URL', { infer: true }),
        schema,
      }),
    }),
  ],
})
export class DatabaseModule {}
