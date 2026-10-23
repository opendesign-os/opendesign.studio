import { Module, StandardSchemaValidationPipe } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_PIPE } from '@nestjs/core'
import { DatabaseModule } from './common/database/database.module'
import { QueueModule } from './common/queue/queue.module'
import { StorageModule } from './common/storage/storage.module'
import { env } from './config/env'
import { AssetsModule } from './modules/assets/assets.module'
import { AuthModule } from './modules/auth/auth.module'
import { CandidatesModule } from './modules/candidates/candidates.module'
import { EpisodesModule } from './modules/episodes/episodes.module'
import { MediaModule } from './modules/media/media.module'
import { OverviewModule } from './modules/overview/overview.module'
import { ProvidersModule } from './modules/providers/providers.module'
import { RelationsModule } from './modules/relations/relations.module'
import { SeriesModule } from './modules/series/series.module'
import { ShotsModule } from './modules/shots/shots.module'
import { TasksModule } from './modules/tasks/tasks.module'
import { VendorsModule } from './modules/vendors/vendors.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: env }),
    DatabaseModule,
    StorageModule,
    QueueModule,
    AuthModule,
    SeriesModule,
    EpisodesModule,
    CandidatesModule,
    AssetsModule,
    RelationsModule,
    ShotsModule,
    TasksModule,
    VendorsModule,
    ProvidersModule,
    OverviewModule,
    MediaModule,
  ],
  providers: [{ provide: APP_PIPE, useValue: new StandardSchemaValidationPipe() }],
})
export class AppModule {}
