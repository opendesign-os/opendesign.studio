import type { EpisodePatch } from '@opendesign/models'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { keys } from './keys'
import * as mock from './mock'

export function useAllEpisodes() {
  return useQuery({ queryKey: keys.allEpisodes, queryFn: mock.listAllEpisodes })
}

export function useEpisodes(seriesId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => keys.episodes(toValue(seriesId))),
    queryFn: () => mock.listEpisodes(toValue(seriesId)),
  })
}

export function useEpisode(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => keys.episode(toValue(id))),
    queryFn: () => mock.readEpisode(toValue(id)),
  })
}

export function usePatchEpisode() {
  const client = useQueryClient()
  return useMutation({
    mutationKey: ['patch', 'episode'],
    mutationFn: ({ id, patch }: { id: string; patch: EpisodePatch }) =>
      mock.patchEpisode(id, patch),
    onSuccess: (episode) => {
      client.setQueryData(keys.episode(episode.id), episode)
      void client.invalidateQueries({ queryKey: keys.allEpisodes })
    },
  })
}

export function useParseEpisode() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: mock.parseEpisode,
    onSuccess: (episode) => {
      void client.invalidateQueries({ queryKey: keys.candidates(episode.id) })
      void client.invalidateQueries({ queryKey: keys.tasks })
      void client.invalidateQueries({ queryKey: keys.overview })
    },
  })
}

export function useRenderEpisode() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: mock.renderEpisode,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: keys.tasks })
      void client.invalidateQueries({ queryKey: keys.overview })
    },
  })
}

export function useCandidates(episodeId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => keys.candidates(toValue(episodeId))),
    queryFn: () => mock.listCandidates(toValue(episodeId)),
  })
}

export function useResolveCandidate() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      mock.resolveCandidate(id, accept),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['candidates'] })
      void client.invalidateQueries({ queryKey: ['assets'] })
      void client.invalidateQueries({ queryKey: keys.overview })
    },
  })
}
