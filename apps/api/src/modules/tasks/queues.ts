import type { ProviderKind, TaskKind } from '@opendesign/models'

export type Lane = ProviderKind | 'compose' | 'episode'

export const lanes: Record<TaskKind, Lane> = {
  script: 'text',
  episode: 'episode',
  image: 'image',
  keyframe: 'image',
  video: 'video',
  compose: 'compose',
}

export const queues: Record<Lane, { workers: number; expire: number }> = {
  text: { workers: 4, expire: 900 },
  image: { workers: 8, expire: 900 },
  video: { workers: 8, expire: 3600 },
  compose: { workers: 2, expire: 3600 },
  episode: { workers: 2, expire: 7200 },
}

export function tiers(workers: number) {
  return Object.fromEntries(
    Array.from({ length: 8 }, (_, index) => [String(index + 1), Math.min(index + 1, workers)]),
  )
}
