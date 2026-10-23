import { tenth } from '@opendesign/common'
import type { ShotPatch } from '@opendesign/models'
import { MIN_DURATION, split } from '@opendesign/models'
import { plain, reject, settle, store, sync } from './store'

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
