import type { TaskKind, TaskStatus } from './schema'

export const taskKindLabel: Record<TaskKind, string> = {
  script: '剧本拆解',
  episode: '整集生成',
  image: '资产出图',
  keyframe: '关键帧',
  video: '视频生成',
  compose: '合成出片',
}

export const taskStatusLabel: Record<TaskStatus, string> = {
  queued: '排队中',
  running: '进行中',
  done: '已完成',
  failed: '失败',
}
