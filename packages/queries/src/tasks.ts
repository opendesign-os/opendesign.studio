import type { TaskKind } from '@opendesign/models'
import { type QueryKey, useMutation, useQuery } from '@tanstack/vue-query'
import { keys, useInvalidate } from './cache'
import * as mock from './mock'

const affects: Record<TaskKind, QueryKey[]> = {
  script: [keys.candidates()],
  image: [keys.assets()],
  keyframe: [keys.shots(), keys.episode(), keys.episodes()],
  video: [keys.shots(), keys.episode(), keys.episodes()],
  voice: [],
  compose: [],
}

export function useTasks() {
  return useQuery({ queryKey: keys.tasks, queryFn: mock.listTasks })
}

export function useCreateTask() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: mock.createTask,
    onSuccess: (task) => invalidate(keys.tasks, keys.overview, ...affects[task.kind]),
  })
}

export function useCancelTask() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: mock.cancelTask,
    onSuccess: () => invalidate(keys.tasks, keys.overview),
  })
}

export function useRetryTask() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: mock.retryTask,
    onSuccess: () => invalidate(keys.tasks, keys.overview),
  })
}
