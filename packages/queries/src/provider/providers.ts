import type { Provider, ProviderPatch } from '@opendesign/models'
import { useQuery } from '@tanstack/vue-query'
import { api } from '../common/api'
import { keys, usePatch } from '../common/cache'

export function useProviders() {
  return useQuery({ queryKey: keys.providers, queryFn: () => api<Provider[]>('providers') })
}

export function usePatchProvider() {
  return usePatch({
    name: 'provider',
    scopes: [keys.providers],
    request: (id, patch: ProviderPatch) =>
      api<Provider>(`providers/${id}`, { method: 'PATCH', body: patch }),
  })
}
