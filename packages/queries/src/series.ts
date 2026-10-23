import type { Series, SeriesPatch } from '@opendesign/models'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { keys } from './keys'
import * as mock from './mock'

export function useSeriesList() {
  return useQuery({ queryKey: keys.series, queryFn: mock.listSeries })
}

export function useSeries(id: MaybeRefOrGetter<string>) {
  const client = useQueryClient()
  return useQuery({
    queryKey: computed(() => keys.seriesDetail(toValue(id))),
    queryFn: () => mock.readSeries(toValue(id)),
    initialData: () =>
      client.getQueryData<Series[]>(keys.series)?.find((item) => item.id === toValue(id)),
  })
}

export function usePatchSeries() {
  const client = useQueryClient()
  return useMutation({
    mutationKey: ['patch', 'series'],
    mutationFn: ({ id, patch }: { id: string; patch: SeriesPatch }) => mock.patchSeries(id, patch),
    onMutate: async ({ id, patch }) => {
      await client.cancelQueries({ queryKey: keys.seriesDetail(id) })
      client.setQueryData<Series>(keys.seriesDetail(id), (value) =>
        value ? { ...value, ...patch } : value,
      )
    },
    onSuccess: (series) => {
      client.setQueryData(keys.seriesDetail(series.id), series)
    },
    onError: (_, { id }) => {
      void client.invalidateQueries({ queryKey: keys.seriesDetail(id) })
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: keys.series, exact: true })
    },
  })
}

export function useOverview() {
  return useQuery({ queryKey: keys.overview, queryFn: mock.readOverview })
}
