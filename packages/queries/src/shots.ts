import type { Shot, ShotPatch, Slot } from '@opendesign/models'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { keys } from './keys'
import * as mock from './mock'

export function useShots(episodeId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => keys.shots(toValue(episodeId))),
    queryFn: () => mock.listShots(toValue(episodeId)),
  })
}

function useRefresh() {
  const client = useQueryClient()
  return (shot: Shot, ...extra: (readonly unknown[])[]) => {
    for (const queryKey of [
      keys.shots(shot.episodeId),
      keys.episode(shot.episodeId),
      keys.allEpisodes,
      keys.overview,
      ...extra,
    ]) {
      void client.invalidateQueries({ queryKey })
    }
  }
}

const PATCH = ['patch', 'shot'] as const

export function usePatchShot() {
  const client = useQueryClient()
  const refresh = useRefresh()
  return useMutation({
    mutationKey: PATCH,
    mutationFn: ({ id, patch }: { id: string; patch: ShotPatch }) => mock.patchShot(id, patch),
    onMutate: async ({ id, patch }) => {
      await client.cancelQueries({ queryKey: ['shots'] })
      const merge = (shot: Shot): Shot => (shot.id === id ? { ...shot, ...patch } : shot)
      client.setQueriesData<Shot[]>({ queryKey: ['shots'] }, (old) => old?.map(merge))
    },
    onSettled: (shot) => {
      if (shot && client.isMutating({ mutationKey: PATCH }) === 1) refresh(shot)
    },
  })
}

export function useSplitShot() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ id, at }: { id: string; at: number }) => mock.splitShot(id, at),
    onSuccess: (shot) => refresh(shot),
  })
}

export function useGenerateKeyframe() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ id, slot }: { id: string; slot: Slot }) => mock.generateKeyframe(id, slot),
    onSuccess: (shot) => refresh(shot, keys.tasks),
  })
}

export function useGenerateVideo() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: mock.generateVideo,
    onSuccess: (shot) => refresh(shot, keys.tasks),
  })
}

export function useGenerateVoice() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: mock.generateVoice,
    onSuccess: (shot) => refresh(shot, keys.tasks),
  })
}
