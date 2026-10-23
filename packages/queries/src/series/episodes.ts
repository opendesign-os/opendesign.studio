import type { Episode, EpisodeDraft, EpisodePatch } from '@opendesign/models'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { api } from '../common/api'
import { keys, useInvalidate, usePatch } from '../common/cache'

export function useEpisodes(seriesId?: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => keys.episodes(toValue(seriesId))),
    queryFn: () => api<Episode[]>('episodes', { query: { seriesId: toValue(seriesId) } }),
    enabled: computed(() => seriesId === undefined || Boolean(toValue(seriesId))),
  })
}

export function useEpisode(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => keys.episode(toValue(id))),
    queryFn: () => api<Episode>(`episodes/${toValue(id)}`),
    enabled: computed(() => Boolean(toValue(id))),
  })
}

export function useCreateEpisode() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ seriesId, draft }: { seriesId: string; draft: EpisodeDraft }) =>
      api<Episode>('episodes', { method: 'POST', body: { seriesId, ...draft } }),
    onSuccess: () => invalidate(keys.episodes(), keys.overview),
  })
}

export function usePatchEpisode() {
  return usePatch({
    name: 'episode',
    scopes: [keys.episode(), keys.episodes()],
    request: (id, patch: EpisodePatch) =>
      api<Episode>(`episodes/${id}`, { method: 'PATCH', body: patch }),
  })
}
