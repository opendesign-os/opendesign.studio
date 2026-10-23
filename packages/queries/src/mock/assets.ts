import type { AssetDraft, AssetPatch } from '@opendesign/models'
import { plain, reject, remove, settle, store } from './store'

export function listAssets(seriesId: string) {
  return settle(store.assets.filter((item) => item.seriesId === seriesId))
}

export function createAsset(seriesId: string, draft: AssetDraft) {
  const created = plain({ ...draft, id: `a${Date.now()}`, seriesId, references: [] })
  store.assets.push(created)
  return settle(created)
}

export function patchAsset(id: string, patch: AssetPatch) {
  const found = store.assets.find((item) => item.id === id)
  if (!found) return reject(`找不到资产 ${id}`)
  Object.assign(found, plain(patch))
  return settle(found)
}

export function removeAsset(id: string) {
  const removed = remove(store.assets, id)
  if (!removed) return reject(`找不到资产 ${id}`)
  for (const shot of store.shots) shot.cast = shot.cast.filter((item) => item !== id)
  return settle(removed)
}
