import type { Series, SeriesDraft, SeriesPatch } from '@opendesign/models'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { api } from '../common/api'
import { keys, useInvalidate, usePatch } from '../common/cache'

export function useSeriesList() {
  return useQuery({ queryKey: keys.series(), queryFn: () => api<Series[]>('series') })
}

export function useSeries(id: MaybeRefOrGetter<string>) {
  const client = useQueryClient()
  return useQuery({
    queryKey: computed(() => keys.series(toValue(id))),
    queryFn: () => api<Series>(`series/${toValue(id)}`),
    enabled: computed(() => Boolean(toValue(id))),
    initialData: () =>
      client.getQueryData<Series[]>(keys.series())?.find((item) => item.id === toValue(id)),
  })
}

export function useCreateSeries() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (draft: SeriesDraft) => api<Series>('series', { method: 'POST', body: draft }),
    onSuccess: () => invalidate(keys.series(), keys.episodes(), keys.overview),
  })
}

export function usePatchSeries() {
  return usePatch({
    name: 'series',
    scopes: [keys.series()],
    request: (id, patch: SeriesPatch) =>
      api<Series>(`series/${id}`, { method: 'PATCH', body: patch }),
  })
}
