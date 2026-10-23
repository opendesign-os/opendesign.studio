import type { Relation, RelationDraft, RelationPatch } from '@opendesign/models'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { api } from '../common/api'
import { keys, useInvalidate, usePatch } from '../common/cache'

export function useRelations(seriesId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => keys.relations(toValue(seriesId))),
    queryFn: () => api<Relation[]>('relations', { query: { seriesId: toValue(seriesId) } }),
    enabled: computed(() => Boolean(toValue(seriesId))),
  })
}

export function useCreateRelation() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ seriesId, draft }: { seriesId: string; draft: RelationDraft }) =>
      api<Relation>('relations', { method: 'POST', body: { seriesId, ...draft } }),
    onSuccess: (relation) => invalidate(keys.relations(relation.seriesId)),
  })
}

export function usePatchRelation() {
  return usePatch({
    name: 'relation',
    scopes: [keys.relations()],
    request: (id, patch: RelationPatch) =>
      api<Relation>(`relations/${id}`, { method: 'PATCH', body: patch }),
  })
}

export function useRemoveRelation() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => api<Relation>(`relations/${id}`, { method: 'DELETE' }),
    onSuccess: (relation) => invalidate(keys.relations(relation.seriesId)),
  })
}
