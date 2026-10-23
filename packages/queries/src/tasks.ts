import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { keys } from './keys'
import * as mock from './mock'

export function useTasks() {
  return useQuery({ queryKey: keys.tasks, queryFn: mock.listTasks })
}

function useRefresh() {
  const client = useQueryClient()
  return () => {
    void client.invalidateQueries({ queryKey: keys.tasks })
    void client.invalidateQueries({ queryKey: keys.overview })
  }
}

export function useCancelTask() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: mock.cancelTask, onSuccess: refresh })
}

export function useRetryTask() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: mock.retryTask, onSuccess: refresh })
}
