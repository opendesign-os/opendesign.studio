import type { AssetDraft } from '@opendesign/models'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { keys, useInvalidate, usePatch } from './cache'
import * as mock from './mock'

export function useAssets(seriesId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => keys.assets(toValue(seriesId))),
    queryFn: () => mock.listAssets(toValue(seriesId)),
  })
}

export function useCreateAsset() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ seriesId, draft }: { seriesId: string; draft: AssetDraft }) =>
      mock.createAsset(seriesId, draft),
    onSuccess: (asset) => invalidate(keys.assets(asset.seriesId), keys.overview),
  })
}

export function usePatchAsset() {
  return usePatch({
    name: 'asset',
    scopes: [keys.assets()],
    request: mock.patchAsset,
    affects: () => [keys.overview],
  })
}

export function useRemoveAsset() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: mock.removeAsset,
    onSuccess: (asset) => invalidate(keys.assets(asset.seriesId), keys.shots(), keys.overview),
  })
}
