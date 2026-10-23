import type { Task, TaskKind, TaskRequest, TaskStatus } from '@opendesign/models'
import { live } from '@opendesign/models'
import { type QueryKey, useMutation, useQuery } from '@tanstack/vue-query'
import { watch } from 'vue'
import { api } from '../common/api'
import { keys, useInvalidate } from '../common/cache'

const affects: Record<TaskKind, QueryKey[]> = {
  script: [keys.shots(), keys.candidates(), keys.episode(), keys.episodes()],
  image: [keys.assets()],
  keyframe: [keys.shots(), keys.episode(), keys.episodes()],
  video: [keys.shots(), keys.episode(), keys.episodes()],
  voice: [keys.shots()],
  compose: [keys.episode(), keys.episodes()],
}

const POLL = 2000

const pending: TaskStatus[] = ['queued', 'running']

export function useTasks() {
  const invalidate = useInvalidate()
  const query = useQuery({
    queryKey: keys.tasks,
    queryFn: () => api<Task[]>('tasks'),
    refetchInterval: (state) => (state.state.data?.some(live) ? POLL : false),
  })
  watch(query.data, (next, previous) => {
    const before = new Map(previous?.map((item) => [item.id, item.status]))
    const settled = (next ?? []).filter(
      (item) => !live(item) && pending.includes(before.get(item.id) ?? item.status),
    )
    if (settled.length) {
      void invalidate(keys.overview, ...settled.flatMap((item) => affects[item.kind]))
    }
  })
  return query
}

export function useCreateTask() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (request: TaskRequest) => api<Task>('tasks', { method: 'POST', body: request }),
    onSuccess: (task) => invalidate(keys.tasks, keys.overview, ...affects[task.kind]),
  })
}

export function useCancelTask() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => api<Task>(`tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidate(keys.tasks, keys.overview),
  })
}

export function useRetryTask() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => api<Task>(`tasks/${id}/retry`, { method: 'POST' }),
    onSuccess: () => invalidate(keys.tasks, keys.overview),
  })
}
