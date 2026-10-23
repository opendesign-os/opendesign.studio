import { Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import { emotionLabel } from '@opendesign/models'
import { assets, shots } from '@opendesign/schemas'
import { generateSpeech } from 'ai'
import { eq } from 'drizzle-orm'
import type { Database } from '../../../common/database/database.module'
import { StorageService } from '../../../common/storage/storage.service'
import { attempt } from '../../providers/attempt'
import { ProvidersService } from '../../providers/providers.service'
import * as protocols from '../../vendors/protocols'
import type { Context, Job } from './context'

@Injectable()
export class VoiceJob implements Job {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly providers: ProvidersService,
    private readonly storage: StorageService,
  ) {}

  async run({ task, signal, progress }: Context) {
    if (task.request.kind !== 'voice') throw new Error('任务类型不匹配')
    const [shot] = await this.db.select().from(shots).where(eq(shots.id, task.request.shotId))
    if (!shot) throw new Error('镜头不存在')
    const lines = shot.dialogue.filter((item) => item.line.trim())
    if (!lines.length) throw new Error('这个镜头没有台词')
    const roster = new Map(
      (await this.db.select().from(assets).where(eq(assets.seriesId, task.seriesId))).map(
        (item) => [item.id, item],
      ),
    )
    const settings = await this.providers.read(task.organizationId, 'voice')
    const intensity = Math.round(Number(settings.params.emotion ?? 0.6) * 100)

    const results = new Map<string, { line: string; audio: string }>()
    for (const [position, line] of lines.entries()) {
      const voice = roster.get(line.assetId)?.voice ?? 'narrator'
      const { audio } = await attempt(settings, (model) =>
        generateSpeech({
          model: protocols.speech(settings, model),
          text: line.line,
          voice: String(settings.params[`voice:${voice}`] ?? '') || undefined,
          instructions: model.startsWith('tts-')
            ? undefined
            : `用${emotionLabel[line.emotion]}的语气说这句台词，情绪强度约 ${intensity}%。`,
          speed: Number(settings.params.speed ?? 1),
          outputFormat: 'wav',
          abortSignal: signal,
        }),
      )
      results.set(line.id, {
        line: line.line,
        audio: await this.storage.put(task.organizationId, {
          data: audio.uint8Array,
          type: audio.mediaType,
        }),
      })
      await progress(((position + 1) / lines.length) * 95)
    }

    await this.db.transaction(async (tx) => {
      const [fresh] = await tx.select().from(shots).where(eq(shots.id, shot.id)).for('update')
      if (!fresh) return
      const dialogue = fresh.dialogue.map((item) => {
        const result = results.get(item.id)
        return result?.line === item.line ? { ...item, audio: result.audio } : item
      })
      await tx
        .update(shots)
        .set({ dialogue, status: fresh.status === 'review' ? 'voiced' : fresh.status })
        .where(eq(shots.id, shot.id))
    })
  }
}
