import type { SeriesPatch } from '@opendesign/models'
import { live, locked } from '@opendesign/models'
import { plain, reject, settle, store } from './store'

export function listSeries() {
  return settle(store.series)
}

export function readSeries(id: string) {
  const found = store.series.find((item) => item.id === id)
  return found ? settle(found) : reject(`找不到剧集 ${id}`)
}

export function patchSeries(id: string, patch: SeriesPatch) {
  const found = store.series.find((item) => item.id === id)
  if (!found) return reject(`找不到剧集 ${id}`)
  Object.assign(found, plain(patch), { updated: '刚刚' })
  return settle(found)
}

export function readOverview() {
  return settle({
    series: store.series.length,
    producing: store.series.filter((item) => item.status === 'producing').length,
    shots: store.shots.length,
    blocked: store.shots.filter((item) => item.status === 'draft' || item.status === 'failed')
      .length,
    review: store.shots.filter((item) => item.status === 'review').length,
    running: store.tasks.filter(live).length,
    failed: store.tasks.filter((item) => item.status === 'failed').length,
    assets: store.assets.length,
    loose: store.assets
      .filter((item) => item.kind !== 'character' || item.name !== '旁白')
      .filter((item) => !locked(item)).length,
  })
}
