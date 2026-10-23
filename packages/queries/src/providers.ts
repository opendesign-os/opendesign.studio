import type { Provider, ProviderPatch } from '@opendesign/models'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { keys } from './keys'
import * as mock from './mock'

export function useProviders() {
  return useQuery({ queryKey: keys.providers, queryFn: mock.listProviders })
}

export function usePatchProvider() {
  const client = useQueryClient()
  return useMutation({
    mutationKey: ['patch', 'provider'],
    mutationFn: ({ id, patch }: { id: string; patch: ProviderPatch }) =>
      mock.patchProvider(id, patch),
    onMutate: async ({ id, patch }) => {
      await client.cancelQueries({ queryKey: keys.providers })
      client.setQueryData<Provider[]>(keys.providers, (list) =>
        list?.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      )
    },
    onSettled: () => {
      if (client.isMutating({ mutationKey: ['patch', 'provider'] }) === 1) {
        void client.invalidateQueries({ queryKey: keys.providers })
      }
    },
  })
}

export function useTestProvider() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: mock.testProvider,
    onSettled: () => {
      void client.invalidateQueries({ queryKey: keys.providers })
    },
  })
}
