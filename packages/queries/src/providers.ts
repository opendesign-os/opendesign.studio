import { useMutation, useQuery } from '@tanstack/vue-query'
import { keys, useInvalidate, usePatch } from './cache'
import * as mock from './mock'

export function useProviders() {
  return useQuery({ queryKey: keys.providers, queryFn: mock.listProviders })
}

export function usePatchProvider() {
  return usePatch({ name: 'provider', scopes: [keys.providers], request: mock.patchProvider })
}

export function useTestProvider() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: mock.testProvider,
    onSettled: () => invalidate(keys.providers),
  })
}
