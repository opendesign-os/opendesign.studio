import type { Asset, Candidate } from '@opendesign/models'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { api } from '../common/api'
import { keys, useInvalidate } from '../common/cache'

export function useCandidates(episodeId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => keys.candidates(toValue(episodeId))),
    queryFn: () => api<Candidate[]>('candidates', { query: { episodeId: toValue(episodeId) } }),
    enabled: computed(() => Boolean(toValue(episodeId))),
  })
}

export function useResolveCandidate() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }): Promise<Asset | Candidate> =>
      accept
        ? api<Asset>(`candidates/${id}/accept`, { method: 'POST' })
        : api<Candidate>(`candidates/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidate(keys.candidates(), keys.assets(), keys.overview),
  })
}
