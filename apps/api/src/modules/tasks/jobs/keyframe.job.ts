import { Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import type { Frame } from '@opendesign/models'
import { cameraLabel, shotSizeLabel, slotLabel } from '@opendesign/models'
import { assets, episodes, series, shots } from '@opendesign/schemas'
import { generateImage } from 'ai'
import { eq, inArray } from 'drizzle-orm'
import type { Database } from '../../../common/database/database.module'
import { StorageService } from '../../../common/storage/storage.service'
import { attempt } from '../../providers/attempt'
import { ProvidersService } from '../../providers/providers.service'
import * as protocols from '../../vendors/protocols'
import { canvas } from './canvas'
import type { Context, Job } from './context'

const REFERENCES = 4

function framing(value: Frame) {
  if (value.scale >= 1.3) return '画面推近，主体更大'
  if (value.scale <= 1.05) return '画面完整，留出环境'
  return '常规取景'
}

@Injectable()
export class KeyframeJob implements Job {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly providers: ProvidersService,
    private readonly storage: StorageService,
  ) {}

  async run({ task, signal, progress }: Context) {
    if (task.request.kind !== 'keyframe') throw new Error('任务类型不匹配')
    const { shotId, slot } = task.request
    const [found] = await this.db
      .select({ shot: shots, aspect: series.aspect })
      .from(shots)
      .innerJoin(episodes, eq(episodes.id, shots.episodeId))
      .innerJoin(series, eq(series.id, episodes.seriesId))
      .where(eq(shots.id, shotId))
    if (!found) throw new Error('镜头不存在')
    const { shot, aspect } = found
    const cast = shot.cast.length
      ? await this.db.select().from(assets).where(inArray(assets.id, shot.cast))
      : []
    const settings = await this.providers.read(task.organizationId, 'image')
    const first =
      slot === 'last' ? shot.keyframes.find((item) => item.slot === 'first')?.image : undefined
    const sources = cast.flatMap((item) => {
      const reference =
        item.references.find((entry) => entry.locked && entry.image) ??
        item.references.find((entry) => entry.image)
      return reference?.image ? [reference.image] : []
    })
    const references = await Promise.all(
      [...(first ? [first] : []), ...sources]
        .slice(0, REFERENCES)
        .map((key) => this.storage.get(key)),
    )
    await progress(15)

    const text = [
      shot.prompt.replaceAll('@', ''),
      `${shotSizeLabel[shot.size]}，运镜「${cameraLabel[shot.move.kind]}」的${slotLabel[slot]}：${framing(slot === 'first' ? shot.move.from : shot.move.to)}。`,
      ...cast.map((item) => `${item.name}：${item.prompt}`),
      references.length ? '人物与场景外观和参考图保持一致。' : '',
    ]
      .filter(Boolean)
      .join('\n')
    const { image } = await attempt(settings, (model) =>
      generateImage({
        model: protocols.image(settings, model),
        prompt: references.length ? { text, images: references.map((item) => item.data) } : text,
        ...canvas(settings.protocol, aspect, settings.params.resolution),
        seed: Number(settings.params.seed) || undefined,
        abortSignal: signal,
      }),
    )
    await progress(85)

    const key = await this.storage.put(task.organizationId, {
      data: image.uint8Array,
      type: image.mediaType,
    })
    await this.db.transaction(async (tx) => {
      const [fresh] = await tx.select().from(shots).where(eq(shots.id, shot.id)).for('update')
      if (!fresh) return
      await tx
        .update(shots)
        .set({
          keyframes: fresh.keyframes.map((item) =>
            item.slot === slot ? { ...item, ready: true, image: key } : item,
          ),
          status: fresh.status === 'draft' ? 'keyframe' : fresh.status,
        })
        .where(eq(shots.id, shot.id))
    })
  }
}
