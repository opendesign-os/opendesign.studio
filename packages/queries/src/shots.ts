import type { Shot } from '@opendesign/models'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { keys, useInvalidate, usePatch } from './cache'
import * as mock from './mock'

function affects(shot: Shot) {
  return [keys.episode(shot.episodeId), keys.episodes(), keys.overview]
}

export function useShots(episodeId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => keys.shots(toValue(episodeId))),
    queryFn: () => mock.listShots(toValue(episodeId)),
  })
}

export function usePatchShot() {
  return usePatch({ name: 'shot', scopes: [keys.shots()], request: mock.patchShot, affects })
}

export function useSplitShot() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, at }: { id: string; at: number }) => mock.splitShot(id, at),
    onSuccess: (shot) => invalidate(keys.shots(shot.episodeId), ...affects(shot)),
  })
}
