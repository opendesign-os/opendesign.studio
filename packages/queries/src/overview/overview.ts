import type { Overview } from '@opendesign/models'
import { useQuery } from '@tanstack/vue-query'
import { api } from '../common/api'
import { keys } from '../common/cache'

export function useOverview() {
  return useQuery({ queryKey: keys.overview, queryFn: () => api<Overview>('overview') })
}
