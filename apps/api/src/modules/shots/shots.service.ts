import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectDrizzle } from '@nestjs/drizzle'
import { tenth } from '@opendesign/common'
import type { Keyframe, ShotPatch } from '@opendesign/models'
import { MIN_DURATION, split } from '@opendesign/models'
import { shots } from '@opendesign/schemas'
import { and, asc, eq, gt, sql } from 'drizzle-orm'
import type { Database } from '../../common/database/database.module'
import { one, owned } from '../../common/database/query'

function settle(keyframes: Keyframe[]) {
  return keyframes.map((item) => (item.ready ? item : { slot: item.slot, ready: false }))
}

@Injectable()
export class ShotsService {
  constructor(@InjectDrizzle() private readonly db: Database) {}

  list(tenant: string, episodeId: string) {
    return this.db
      .select()
      .from(shots)
      .where(and(eq(shots.organizationId, tenant), eq(shots.episodeId, episodeId)))
      .orderBy(asc(shots.index))
  }

  update(tenant: string, id: string, patch: ShotPatch) {
    return one(
      this.db
        .update(shots)
        .set(patch)
        .where(owned(shots, id, tenant))
        .returning(),
      '镜头',
    )
  }

  split(tenant: string, id: string, at: number) {
    return this.db.transaction(async (tx) => {
      const { createdAt, createdBy, updatedAt, updatedBy, video, ...shot } = await one(
        tx
          .select()
          .from(shots)
          .where(owned(shots, id, tenant))
          .for('update'),
        '镜头',
      )
      const cut = tenth(at)
      if (cut < MIN_DURATION || cut > shot.duration - MIN_DURATION) {
        throw new BadRequestException('分割点离镜头首尾太近')
      }
      const [head, tail] = split(shot, cut, crypto.randomUUID())
      await tx
        .update(shots)
        .set({ index: sql`${shots.index} + 1` })
        .where(and(eq(shots.episodeId, shot.episodeId), gt(shots.index, shot.index)))
      await tx
        .update(shots)
        .set({ ...head, keyframes: settle(head.keyframes), video: null })
        .where(eq(shots.id, id))
      return one(
        tx
          .insert(shots)
          .values({ ...tail, keyframes: settle(tail.keyframes), organizationId: tenant })
          .returning(),
        '镜头',
      )
    })
  }
}
