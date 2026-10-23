import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import type { Aspect, AssetKind, View } from '@opendesign/models'
import { viewLabel } from '@opendesign/models'
import { assets } from '@opendesign/schemas'
import { generateImage } from 'ai'
import { eq } from 'drizzle-orm'
import type { Database } from '../../../common/database/database.module'
import { StorageService } from '../../../common/storage/storage.service'
import { attempt } from '../../providers/attempt'
import { ProvidersService } from '../../providers/providers.service'
import * as protocols from '../../vendors/protocols'
import { canvas } from './canvas'
import type { Context, Job } from './context'

const REFERENCES = 4

const aspects: Record<AssetKind, Aspect> = {
  character: '3:4',
  costume: '3:4',
  scene: '16:9',
  prop: '1:1',
}

const views: Record<View, string> = {
  front: '正面全身，站姿自然',
  side: '侧面全身',
  back: '背面全身',
  closeup: '面部特写',
}

@Injectable()
export class ReferenceJob implements Job {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly providers: ProvidersService,
    private readonly storage: StorageService,
  ) {}

  async run({ task, signal, progress }: Context) {
    if (task.request.kind !== 'image') throw new Error('任务类型不匹配')
    const { assetId, view } = task.request
    const [asset] = await this.db.select().from(assets).where(eq(assets.id, assetId))
    if (!asset) throw new Error('资产不存在')
    const settings = await this.providers.read(task.organizationId, 'image')
    const references = await Promise.all(
      asset.references
        .flatMap((item) => (item.locked && item.image && item.view !== view ? [item.image] : []))
        .slice(0, REFERENCES)
        .map((key) => this.storage.get(key)),
    )
    await progress(15)

    const text = [
      asset.prompt,
      `${viewLabel[view]}设定图：${views[view]}，纯净背景，光线均匀，便于后续作为参考。`,
      references.length ? '保持与参考图中的外观、服装和配色完全一致。' : '',
    ]
      .filter(Boolean)
      .join('\n')
    const { image } = await attempt(settings, (model) =>
      generateImage({
        model: protocols.image(settings, model),
        prompt: references.length ? { text, images: references.map((item) => item.data) } : text,
        ...canvas(settings.protocol, aspects[asset.kind], settings.params.resolution),
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
      const [fresh] = await tx.select().from(assets).where(eq(assets.id, asset.id)).for('update')
      if (!fresh) return
      const references = fresh.references.some((item) => item.view === view)
        ? fresh.references.map((item) =>
            item.view === view ? { ...item, image: key, locked: false } : item,
          )
        : [...fresh.references, { id: randomUUID(), view, locked: false, image: key }]
      await tx.update(assets).set({ references }).where(eq(assets.id, asset.id))
    })
  }
}
