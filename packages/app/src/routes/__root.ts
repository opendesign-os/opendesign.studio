import type { QueryClient } from '@tanstack/vue-query'
import { createRootRouteWithContext } from '@tanstack/vue-router'

export type RouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({})
