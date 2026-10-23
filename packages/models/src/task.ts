import { z } from 'zod'

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

export type TaskKind = z.infer<typeof taskKind>
export type TaskStatus = z.infer<typeof taskStatus>
export type Task = z.infer<typeof task>

export const taskKindLabel: Record<TaskKind, string> = {
  script: '剧本拆解',
  image: '资产出图',
  keyframe: '关键帧',
  video: '视频生成',
  voice: '配音',
  compose: '合成出片',
}

export const taskStatusLabel: Record<TaskStatus, string> = {
  queued: '排队中',
  running: '进行中',
  done: '已完成',
  failed: '失败',
}

export const taskKinds: TaskKind[] = ['script', 'image', 'keyframe', 'video', 'voice', 'compose']

export function live(item: Task) {
  return item.status === 'queued' || item.status === 'running'
}
