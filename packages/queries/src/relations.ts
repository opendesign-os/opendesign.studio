import type { RelationDraft } from '@opendesign/models'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { keys, useInvalidate, usePatch } from './cache'
import * as mock from './mock'

export function useRelations(seriesId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => keys.relations(toValue(seriesId))),
    queryFn: () => mock.listRelations(toValue(seriesId)),
  })
}

export function useCreateRelation() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ seriesId, draft }: { seriesId: string; draft: RelationDraft }) =>
      mock.createRelation(seriesId, draft),
    onSuccess: (relation) => invalidate(keys.relations(relation.seriesId)),
  })
}

export function usePatchRelation() {
  return usePatch({ name: 'relation', scopes: [keys.relations()], request: mock.patchRelation })
}

export function useRemoveRelation() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: mock.removeRelation,
    onSuccess: (relation) => invalidate(keys.relations(relation.seriesId)),
  })
}
