import type { RelationDraft, RelationPatch } from '@opendesign/models'
import { plain, reject, remove, settle, store } from './store'

export function listRelations(seriesId: string) {
  return settle(store.relations.filter((item) => item.seriesId === seriesId))
}

export function createRelation(seriesId: string, draft: RelationDraft) {
  const created = plain({ ...draft, id: `r${Date.now()}`, seriesId })
  store.relations.push(created)
  return settle(created)
}

export function patchRelation(id: string, patch: RelationPatch) {
  const found = store.relations.find((item) => item.id === id)
  if (!found) return reject(`找不到关系 ${id}`)
  Object.assign(found, plain(patch))
  return settle(found)
}

export function removeRelation(id: string) {
  const removed = remove(store.relations, id)
  return removed ? settle(removed) : reject(`找不到关系 ${id}`)
}
