import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PgBoss } from 'pg-boss'
import type { Env } from '../../config/env'

@Global()
@Module({
  providers: [
    {
      provide: PgBoss,
      inject: [ConfigService],
      useFactory: async (config: ConfigService<Env, true>) => {
        const boss = new PgBoss(config.get('DATABASE_URL', { infer: true }))
        await boss.start()
        return boss
      },
    },
  ],
  exports: [PgBoss],
})
export class QueueModule implements OnApplicationShutdown {
  constructor(@Inject(PgBoss) private readonly boss: PgBoss) {}

  async onApplicationShutdown() {
    await this.boss.stop()
  }
}
