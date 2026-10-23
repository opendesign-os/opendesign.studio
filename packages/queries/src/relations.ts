import type { Relation, RelationDraft, RelationPatch } from '@opendesign/models'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { keys } from './keys'
import * as mock from './mock'

export function useRelations(seriesId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => keys.relations(toValue(seriesId))),
    queryFn: () => mock.listRelations(toValue(seriesId)),
  })
}

export function useCreateRelation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ seriesId, draft }: { seriesId: string; draft: RelationDraft }) =>
      mock.createRelation(seriesId, draft),
    onSuccess: (relation) => {
      void client.invalidateQueries({ queryKey: keys.relations(relation.seriesId) })
    },
  })
}

export function usePatchRelation() {
  const client = useQueryClient()
  return useMutation({
    mutationKey: ['patch', 'relation'],
    mutationFn: ({ id, patch }: { id: string; patch: RelationPatch }) =>
      mock.patchRelation(id, patch),
    onMutate: async ({ id, patch }) => {
      await client.cancelQueries({ queryKey: ['relations'] })
      client.setQueriesData<Relation[]>({ queryKey: ['relations'] }, (list) =>
        list?.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      )
    },
    onSettled: () => {
      if (client.isMutating({ mutationKey: ['patch', 'relation'] }) === 1) {
        void client.invalidateQueries({ queryKey: ['relations'] })
      }
    },
  })
}

export function useRemoveRelation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: mock.removeRelation,
    onSuccess: (relation) => {
      if (relation) void client.invalidateQueries({ queryKey: keys.relations(relation.seriesId) })
    },
  })
}
