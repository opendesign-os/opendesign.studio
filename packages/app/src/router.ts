import { QueryClient } from '@tanstack/vue-query'
import { createRouter } from '@tanstack/vue-router'
import { routeTree } from './routeTree.gen'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 60_000 },
  },
})

export const router = createRouter({ routeTree, context: { queryClient } })

declare module '@tanstack/vue-router' {
  interface Register {
    router: typeof router
  }
}
