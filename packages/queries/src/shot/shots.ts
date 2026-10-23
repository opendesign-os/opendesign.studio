import type { Shot, ShotPatch } from '@opendesign/models'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { api } from '../common/api'
import { keys, useInvalidate, usePatch } from '../common/cache'

function affects(shot: Shot) {
  return [keys.episode(shot.episodeId), keys.episodes(), keys.overview]
}

export function useShots(episodeId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => keys.shots(toValue(episodeId))),
    queryFn: () => api<Shot[]>('shots', { query: { episodeId: toValue(episodeId) } }),
    enabled: computed(() => Boolean(toValue(episodeId))),
  })
}

export function usePatchShot() {
  return usePatch({
    name: 'shot',
    scopes: [keys.shots()],
    request: (id, patch: ShotPatch) => api<Shot>(`shots/${id}`, { method: 'PATCH', body: patch }),
    affects,
  })
}

export function useSplitShot() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, at }: { id: string; at: number }) =>
      api<Shot>(`shots/${id}/split`, { method: 'POST', body: { at } }),
    onSuccess: (shot) => invalidate(keys.shots(shot.episodeId), ...affects(shot)),
  })
}
