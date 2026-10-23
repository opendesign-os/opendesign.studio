import { type QueryKey, useMutation, useQueryClient } from '@tanstack/vue-query'

function scope(name: string) {
  return (id?: string): QueryKey => (id === undefined ? [name] : [name, id])
}

export const keys = {
  overview: ['overview'],
  series: scope('series'),
  episodes: scope('episodes'),
  episode: scope('episode'),
  candidates: scope('candidates'),
  assets: scope('assets'),
  relations: scope('relations'),
  shots: scope('shots'),
  tasks: ['tasks'],
  providers: ['providers'],
} as const

export function useInvalidate() {
  const client = useQueryClient()
  return (...queryKeys: QueryKey[]) => {
    for (const queryKey of queryKeys) void client.invalidateQueries({ queryKey })
  }
}

function merge(data: unknown, id: string, patch: object): unknown {
  if (Array.isArray(data)) return data.map((item) => merge(item, id, patch))
  const entity = data && typeof data === 'object' && 'id' in data && data.id === id
  return entity ? { ...data, ...patch } : data
}

type Patch<T, P> = {
  name: string
  scopes: QueryKey[]
  request: (id: string, patch: P) => Promise<T>
  affects?: (item: T) => QueryKey[]
}

export function usePatch<T, P extends object>(options: Patch<T, P>) {
  const client = useQueryClient()
  const invalidate = useInvalidate()
  const mutationKey = ['patch', options.name]
  return useMutation({
    mutationKey,
    mutationFn: ({ id, patch }: { id: string; patch: P }) => options.request(id, patch),
    onMutate: async ({ id, patch }) => {
      await Promise.all(options.scopes.map((queryKey) => client.cancelQueries({ queryKey })))
      for (const queryKey of options.scopes) {
        client.setQueriesData({ queryKey }, (data: unknown) => merge(data, id, patch))
      }
    },
    onSettled: (item) => {
      if (client.isMutating({ mutationKey }) > 1) return
      invalidate(...options.scopes, ...(item && options.affects ? options.affects(item) : []))
    },
  })
}
