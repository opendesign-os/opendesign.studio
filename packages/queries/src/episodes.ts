import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { keys, useInvalidate, usePatch } from './cache'
import * as mock from './mock'

export function useEpisodes(seriesId?: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => keys.episodes(toValue(seriesId))),
    queryFn: () => mock.listEpisodes(toValue(seriesId)),
  })
}

export function useEpisode(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => keys.episode(toValue(id))),
    queryFn: () => mock.readEpisode(toValue(id)),
  })
}

export function usePatchEpisode() {
  return usePatch({
    name: 'episode',
    scopes: [keys.episode(), keys.episodes()],
    request: mock.patchEpisode,
  })
}

export function useCandidates(episodeId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => keys.candidates(toValue(episodeId))),
    queryFn: () => mock.listCandidates(toValue(episodeId)),
  })
}

export function useResolveCandidate() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      mock.resolveCandidate(id, accept),
    onSuccess: () => invalidate(keys.candidates(), keys.assets(), keys.overview),
  })
}
