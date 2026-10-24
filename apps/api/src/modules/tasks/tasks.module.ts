import { Module } from '@nestjs/common'
import { CandidatesModule } from '../candidates/candidates.module'
import { ProvidersModule } from '../providers/providers.module'
import { ComposeJob } from './jobs/compose.job'
import { EpisodeJob } from './jobs/episode.job'
import { KeyframeJob } from './jobs/keyframe.job'
import { ReferenceJob } from './jobs/reference.job'
import { ScriptJob } from './jobs/script.job'
import { VideoJob } from './jobs/video.job'
import { TasksController } from './tasks.controller'
import { TasksService } from './tasks.service'
import { TasksWorker } from './tasks.worker'

@Module({
  imports: [ProvidersModule, CandidatesModule],
  controllers: [TasksController],
  providers: [
    TasksService,
    TasksWorker,
    ScriptJob,
    ReferenceJob,
    KeyframeJob,
    VideoJob,
    ComposeJob,
    EpisodeJob,
  ],
})
export class TasksModule {}
