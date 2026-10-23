import * as seed from './seed'

export const store = {
  series: structuredClone(seed.series),
  episodes: structuredClone(seed.episodes),
  assets: structuredClone(seed.assets),
  candidates: structuredClone(seed.candidates),
  shots: structuredClone(seed.shots),
  tasks: structuredClone(seed.tasks),
  providers: structuredClone(seed.providers),
  relations: structuredClone(seed.relations),
}

const LATENCY = 140

export function settle<T>(value: T) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(structuredClone(value)), LATENCY)
  })
}

export function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function reject(message: string) {
  return Promise.reject(new Error(message))
}

export function remove<T extends { id: string }>(list: T[], id: string) {
  const index = list.findIndex((item) => item.id === id)
  return index < 0 ? undefined : list.splice(index, 1)[0]
}

export function sync(episodeId: string) {
  const episode = store.episodes.find((item) => item.id === episodeId)
  if (!episode) return
  const rows = store.shots.filter((item) => item.episodeId === episodeId)
  episode.shots = rows.length
  episode.done = rows.filter((item) => item.status === 'composed').length
  episode.duration = Math.round(rows.reduce((total, item) => total + item.duration, 0))
  if (episode.shots === 0) episode.status = episode.script ? 'parsing' : 'draft'
  else episode.status = episode.done === episode.shots ? 'done' : 'producing'
}
