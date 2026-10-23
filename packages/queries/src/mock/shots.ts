import { tenth } from '@opendesign/common'
import type { ShotPatch, Slot } from '@opendesign/models'
import { MIN_DURATION, slotLabel, split } from '@opendesign/models'
import { enqueue, model, plain, reject, settle, store, sync } from './store'

export function listShots(episodeId: string) {
  const rows = store.shots
    .filter((item) => item.episodeId === episodeId)
    .sort((a, b) => a.index - b.index)
  return settle(rows)
}

export function patchShot(id: string, patch: ShotPatch) {
  const found = store.shots.find((item) => item.id === id)
  if (!found) return reject(`找不到镜头 ${id}`)
  Object.assign(found, plain(patch))
  sync(found.episodeId)
  return settle(found)
}

export function splitShot(id: string, at: number) {
  const found = store.shots.find((item) => item.id === id)
  if (!found) return reject(`找不到镜头 ${id}`)
  const cut = tenth(at)
  if (cut < MIN_DURATION || cut > found.duration - MIN_DURATION) {
    return reject('分割点离镜头首尾太近')
  }
  const [head, tail] = split(found, cut, `${found.id}-${Date.now().toString(36)}`)
  for (const item of store.shots) {
    if (item.episodeId === found.episodeId && item.index > found.index) item.index += 1
  }
  Object.assign(found, plain(head))
  store.shots.push(plain(tail))
  sync(found.episodeId)
  return settle(tail)
}

function episodeOf(shotId: string) {
  const shot = store.shots.find((item) => item.id === shotId)
  const episode = store.episodes.find((item) => item.id === shot?.episodeId)
  return shot && episode ? { shot, episode } : null
}

export function generateKeyframe(id: string, slot: Slot) {
  const found = episodeOf(id)
  if (!found) return reject(`找不到镜头 ${id}`)
  const { shot, episode } = found
  enqueue({
    kind: 'keyframe',
    title: `镜 ${shot.index} · ${slotLabel[slot]}`,
    seriesId: episode.seriesId,
    episodeId: episode.id,
    shotId: shot.id,
    model: model('image'),
  })
  const frame = shot.keyframes.find((item) => item.slot === slot)
  if (frame) frame.ready = true
  if (shot.status === 'draft') shot.status = 'keyframe'
  sync(episode.id)
  return settle(shot)
}

export function generateVideo(id: string) {
  const found = episodeOf(id)
  if (!found) return reject(`找不到镜头 ${id}`)
  const { shot, episode } = found
  enqueue({
    kind: 'video',
    title: `镜 ${shot.index} · ${shot.scene}`,
    seriesId: episode.seriesId,
    episodeId: episode.id,
    shotId: shot.id,
    model: model('video'),
  })
  shot.status = 'generating'
  sync(episode.id)
  return settle(shot)
}

export function generateVoice(id: string) {
  const found = episodeOf(id)
  if (!found) return reject(`找不到镜头 ${id}`)
  const { shot, episode } = found
  enqueue({
    kind: 'voice',
    title: `镜 ${shot.index} · 配音`,
    seriesId: episode.seriesId,
    episodeId: episode.id,
    shotId: shot.id,
    model: model('voice'),
  })
  return settle(shot)
}
