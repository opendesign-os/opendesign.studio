import type { Asset, AssetDraft, AssetPatch } from '@opendesign/models'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { api } from '../common/api'
import { keys, useInvalidate, usePatch } from '../common/cache'

export function useAssets(seriesId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => keys.assets(toValue(seriesId))),
    queryFn: () => api<Asset[]>('assets', { query: { seriesId: toValue(seriesId) } }),
    enabled: computed(() => Boolean(toValue(seriesId))),
  })
}

export function useCreateAsset() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ seriesId, draft }: { seriesId: string; draft: AssetDraft }) =>
      api<Asset>('assets', { method: 'POST', body: { seriesId, ...draft } }),
    onSuccess: (asset) => invalidate(keys.assets(asset.seriesId), keys.overview),
  })
}

export function usePatchAsset() {
  return usePatch({
    name: 'asset',
    scopes: [keys.assets()],
    request: (id, patch: AssetPatch) =>
      api<Asset>(`assets/${id}`, { method: 'PATCH', body: patch }),
    affects: () => [keys.overview],
  })
}

export function useRemoveAsset() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => api<Asset>(`assets/${id}`, { method: 'DELETE' }),
    onSuccess: (asset) => invalidate(keys.assets(asset.seriesId), keys.shots(), keys.overview),
  })
}
