import { z } from 'zod'
import { view } from '../asset/schema'
import { slot } from '../shot/schema'

export const taskKind = z.enum(['script', 'image', 'keyframe', 'video', 'voice', 'compose'])

export const taskStatus = z.enum(['queued', 'running', 'done', 'failed'])

export const task = z.object({
  id: z.string(),
  kind: taskKind,
  status: taskStatus,
  title: z.string(),
  seriesId: z.string(),
  episodeId: z.string().optional(),
  shotId: z.string().optional(),
  model: z.string(),
  progress: z.number().min(0).max(100),
  elapsed: z.number().nonnegative(),
  error: z.string().optional(),
})

export const taskRequest = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('script'), episodeId: z.uuid() }),
  z.object({ kind: z.literal('compose'), episodeId: z.uuid() }),
  z.object({ kind: z.literal('image'), assetId: z.uuid(), view }),
  z.object({ kind: z.literal('keyframe'), shotId: z.uuid(), slot }),
  z.object({ kind: z.literal('video'), shotId: z.uuid() }),
  z.object({ kind: z.literal('voice'), shotId: z.uuid() }),
])

export type TaskKind = z.infer<typeof taskKind>
export type TaskStatus = z.infer<typeof taskStatus>
export type Task = z.infer<typeof task>
export type TaskRequest = z.infer<typeof taskRequest>

export function live(item: Task) {
  return item.status === 'queued' || item.status === 'running'
}
