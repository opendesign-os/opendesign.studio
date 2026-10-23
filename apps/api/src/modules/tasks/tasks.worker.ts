import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import type { TaskKind } from '@opendesign/models'
import { actor, tasks } from '@opendesign/schemas'
import { eq } from 'drizzle-orm'
import { type JobWithMetadata, PgBoss } from 'pg-boss'
import type { Database } from '../../common/database/database.module'
import { ComposeJob } from './jobs/compose.job'
import type { Job, Task } from './jobs/context'
import { KeyframeJob } from './jobs/keyframe.job'
import { ReferenceJob } from './jobs/reference.job'
import { ScriptJob } from './jobs/script.job'
import { VideoJob } from './jobs/video.job'
import { VoiceJob } from './jobs/voice.job'
import { queues, tiers } from './queues'

type Payload = { taskId: string }

function reason(error: unknown) {
  return (error instanceof Error ? error.message : String(error)).slice(0, 500)
}

@Injectable()
export class TasksWorker implements OnApplicationBootstrap {
  private readonly jobs: Record<TaskKind, Job>

  constructor(
    @Inject(PgBoss) private readonly boss: PgBoss,
    @InjectDrizzle() private readonly db: Database,
    script: ScriptJob,
    reference: ReferenceJob,
    keyframe: KeyframeJob,
    video: VideoJob,
    voice: VoiceJob,
    compose: ComposeJob,
  ) {
    this.jobs = { script, image: reference, keyframe, video, voice, compose }
  }

  async onApplicationBootstrap() {
    for (const [name, queue] of Object.entries(queues)) {
      if (!(await this.boss.getQueue(name))) {
        await this.boss.createQueue(name, { expireInSeconds: queue.expire })
      }
      await this.boss.work(
        name,
        {
          includeMetadata: true,
          localConcurrency: queue.workers,
          groupConcurrency: { default: 1, tiers },
        },
        async ([job]: JobWithMetadata<Payload>[]) => {
          if (job) await this.handle(job)
        },
      )
    }
  }

  private async handle(job: JobWithMetadata<Payload>) {
    const [task] = await this.db.select().from(tasks).where(eq(tasks.id, job.data.taskId))
    if (!task) return
    await this.update(task, {
      status: 'running',
      progress: 0,
      error: null,
      startedAt: new Date(),
      finishedAt: null,
    })
    const context = {
      task,
      signal: job.signal,
      progress: (value: number) => this.update(task, { progress: Math.round(value) }),
    }
    const run = () => this.jobs[task.kind].run(context)
    try {
      await (task.createdBy ? actor.run(task.createdBy, run) : run())
      await this.update(task, { status: 'done', progress: 100, finishedAt: new Date() })
    } catch (error) {
      const final = job.retryCount >= job.retryLimit
      await this.update(task, {
        status: final ? 'failed' : 'queued',
        error: reason(error),
        finishedAt: final ? new Date() : null,
      })
      throw error
    }
  }

  private async update(task: Task, values: Partial<Task>) {
    await this.db.update(tasks).set(values).where(eq(tasks.id, task.id))
  }
}
