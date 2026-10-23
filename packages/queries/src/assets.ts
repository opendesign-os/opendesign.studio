import type { Asset, AssetDraft, AssetPatch, View } from '@opendesign/models'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { keys } from './keys'
import * as mock from './mock'

export function useAssets(seriesId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => keys.assets(toValue(seriesId))),
    queryFn: () => mock.listAssets(toValue(seriesId)),
  })
}

function useRefresh() {
  const client = useQueryClient()
  return (asset?: Asset) => {
    void client.invalidateQueries({ queryKey: asset ? keys.assets(asset.seriesId) : ['assets'] })
    void client.invalidateQueries({ queryKey: keys.overview })
  }
}

export function useCreateAsset() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ seriesId, draft }: { seriesId: string; draft: AssetDraft }) =>
      mock.createAsset(seriesId, draft),
    onSuccess: refresh,
  })
}

export function usePatchAsset() {
  const refresh = useRefresh()
  return useMutation({
    mutationKey: ['patch', 'asset'],
    mutationFn: ({ id, patch }: { id: string; patch: AssetPatch }) => mock.patchAsset(id, patch),
    onSuccess: refresh,
  })
}

export function useRemoveAsset() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: mock.removeAsset, onSuccess: () => refresh() })
}

export function useGenerateReference() {
  const client = useQueryClient()
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ id, view }: { id: string; view: View }) => mock.generateReference(id, view),
    onSuccess: (asset) => {
      refresh(asset)
      void client.invalidateQueries({ queryKey: keys.tasks })
    },
  })
}
