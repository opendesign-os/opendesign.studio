import type { Series } from '@opendesign/models'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { keys, usePatch } from './cache'
import * as mock from './mock'

export function useSeriesList() {
  return useQuery({ queryKey: keys.series(), queryFn: mock.listSeries })
}

export function useSeries(id: MaybeRefOrGetter<string>) {
  const client = useQueryClient()
  return useQuery({
    queryKey: computed(() => keys.series(toValue(id))),
    queryFn: () => mock.readSeries(toValue(id)),
    initialData: () =>
      client.getQueryData<Series[]>(keys.series())?.find((item) => item.id === toValue(id)),
  })
}

export function usePatchSeries() {
  return usePatch({ name: 'series', scopes: [keys.series()], request: mock.patchSeries })
}

export function useOverview() {
  return useQuery({ queryKey: keys.overview, queryFn: mock.readOverview })
}
