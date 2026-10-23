import { Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import { cameraLabel, easingLabel, shotSizeLabel } from '@opendesign/models'
import { episodes, series, shots } from '@opendesign/schemas'
import { experimental_generateVideo as generateVideo } from 'ai'
import { eq } from 'drizzle-orm'
import type { Database } from '../../../common/database/database.module'
import { StorageService } from '../../../common/storage/storage.service'
import { attempt } from '../../providers/attempt'
import { ProvidersService } from '../../providers/providers.service'
import * as protocols from '../../vendors/protocols'
import { frame } from './canvas'
import type { Context, Job } from './context'

const TIMEOUT = 30 * 60_000

@Injectable()
export class VideoJob implements Job {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly providers: ProvidersService,
    private readonly storage: StorageService,
  ) {}

  async run({ task, signal, progress }: Context) {
    if (task.request.kind !== 'video') throw new Error('任务类型不匹配')
    const [found] = await this.db
      .select({ shot: shots, aspect: series.aspect })
      .from(shots)
      .innerJoin(episodes, eq(episodes.id, shots.episodeId))
      .innerJoin(series, eq(series.id, episodes.seriesId))
      .where(eq(shots.id, task.request.shotId))
    if (!found) throw new Error('镜头不存在')
    const { shot, aspect } = found
    const keys = (['first', 'last'] as const).flatMap((slot) => {
      const image = shot.keyframes.find((item) => item.slot === slot)?.image
      return image ? [{ slot, image }] : []
    })
    if (keys[0]?.slot !== 'first') throw new Error('先生成首帧')

    await this.db.update(shots).set({ status: 'generating' }).where(eq(shots.id, shot.id))
    try {
      const settings = await this.providers.read(task.organizationId, 'video')
      const frames = await Promise.all(keys.map((item) => this.storage.get(item.image)))
      await progress(10)

      const quality = settings.params.resolution
      const prompt = [
        shot.prompt.replaceAll('@', ''),
        `${shotSizeLabel[shot.size]}，运镜「${cameraLabel[shot.move.kind]}」，${easingLabel[shot.move.easing]}。`,
      ].join('\n')
      const { video } = await attempt(settings, (model) =>
        generateVideo({
          model: protocols.video(settings, model),
          prompt,
          frameImages: frames.map((item, index) => ({
            image: item.data,
            frameType: index ? ('last_frame' as const) : ('first_frame' as const),
          })),
          aspectRatio: 'adaptive',
          resolution: frame(aspect, quality),
          duration: shot.duration <= 5 ? 5 : 10,
          providerOptions: { klingai: { mode: quality === '720p' ? 'std' : 'pro' } },
          poll: { timeoutMs: TIMEOUT },
          abortSignal: signal,
        }),
      )
      await progress(90)

      const key = await this.storage.put(task.organizationId, {
        data: video.uint8Array,
        type: video.mediaType,
      })
      await this.db.update(shots).set({ video: key, status: 'review' }).where(eq(shots.id, shot.id))
    } catch (error) {
      await this.db.update(shots).set({ status: 'failed' }).where(eq(shots.id, shot.id))
      throw error
    }
  }
}
