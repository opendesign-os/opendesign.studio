import type { ProviderKind, TaskKind } from '@opendesign/models'

export type Lane = ProviderKind | 'compose'

export const lanes: Record<TaskKind, Lane> = {
  script: 'text',
  image: 'image',
  keyframe: 'image',
  video: 'video',
  voice: 'voice',
  compose: 'compose',
}

export const queues: Record<Lane, { workers: number; expire: number }> = {
  text: { workers: 4, expire: 900 },
  image: { workers: 8, expire: 900 },
  video: { workers: 8, expire: 3600 },
  voice: { workers: 4, expire: 1800 },
  compose: { workers: 2, expire: 3600 },
}

export const tiers = Object.fromEntries(
  Array.from({ length: 8 }, (_, index) => [String(index + 1), index + 1]),
)
