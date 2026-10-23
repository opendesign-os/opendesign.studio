import type { AssetDraft, AssetPatch, View } from '@opendesign/models'
import { viewLabel } from '@opendesign/models'
import { enqueue, model, plain, reject, settle, store } from './store'

export function listAssets(seriesId: string) {
  return settle(store.assets.filter((item) => item.seriesId === seriesId))
}

export function readAsset(id: string) {
  const found = store.assets.find((item) => item.id === id)
  return found ? settle(found) : reject(`找不到资产 ${id}`)
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
  const index = store.assets.findIndex((item) => item.id === id)
  if (index < 0) return reject(`找不到资产 ${id}`)
  store.assets.splice(index, 1)
  for (const shot of store.shots) shot.cast = shot.cast.filter((item) => item !== id)
  return settle(id)
}

export function generateReference(id: string, view: View) {
  const found = store.assets.find((item) => item.id === id)
  if (!found) return reject(`找不到资产 ${id}`)
  enqueue({
    kind: 'image',
    title: `${found.name} · ${viewLabel[view]}参考图`,
    seriesId: found.seriesId,
    model: model('image'),
  })
  return settle(found)
}
