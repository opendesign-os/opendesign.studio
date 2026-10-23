import type { EpisodePatch } from '@opendesign/models'
import { enqueue, model, plain, reject, settle, store, sync } from './store'

export function listAllEpisodes() {
  return settle(store.episodes)
}

export function listEpisodes(seriesId: string) {
  return settle(store.episodes.filter((item) => item.seriesId === seriesId))
}

export function readEpisode(id: string) {
  const found = store.episodes.find((item) => item.id === id)
  return found ? settle(found) : reject(`找不到分集 ${id}`)
}

export function patchEpisode(id: string, patch: EpisodePatch) {
  const found = store.episodes.find((item) => item.id === id)
  if (!found) return reject(`找不到分集 ${id}`)
  Object.assign(found, plain(patch))
  sync(id)
  return settle(found)
}

export function parseEpisode(id: string) {
  const found = store.episodes.find((item) => item.id === id)
  if (!found) return reject(`找不到分集 ${id}`)
  enqueue({
    kind: 'script',
    title: `第 ${found.index} 集 · 剧本拆解`,
    seriesId: found.seriesId,
    episodeId: found.id,
    model: model('text'),
  })
  return settle(found)
}

export function renderEpisode(id: string) {
  const found = store.episodes.find((item) => item.id === id)
  const series = store.series.find((item) => item.id === found?.seriesId)
  if (!found || !series) return reject(`找不到分集 ${id}`)
  const created = enqueue({
    kind: 'compose',
    title: `${series.title} 第 ${found.index} 集`,
    seriesId: series.id,
    episodeId: found.id,
    model: 'ffmpeg',
  })
  return settle(created)
}

export function listCandidates(episodeId: string) {
  return settle(store.candidates.filter((item) => item.episodeId === episodeId))
}

export function resolveCandidate(id: string, accept: boolean) {
  const index = store.candidates.findIndex((item) => item.id === id)
  const candidate = store.candidates[index]
  if (!candidate) return reject(`找不到候选 ${id}`)
  const episode = store.episodes.find((item) => item.id === candidate.episodeId)
  if (!episode) return reject(`找不到分集 ${candidate.episodeId}`)
  if (accept) {
    store.assets.push({
      id: `a${Date.now()}`,
      seriesId: episode.seriesId,
      kind: candidate.kind,
      name: candidate.name,
      summary: '',
      prompt: candidate.prompt,
      color: '#7f8a94',
      references: [],
    })
  }
  store.candidates.splice(index, 1)
  return settle(id)
}
