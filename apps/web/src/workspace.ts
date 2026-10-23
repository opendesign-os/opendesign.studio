import { useEpisode } from '@opendesign/queries'
import { useParams } from '@tanstack/vue-router'
import { useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'

export type Dialog = 'home' | 'assets' | 'settings'

export const dialog = ref<Dialog | null>(null)

export const recent = useLocalStorage('recent-episode', '')

export function useWorkspace() {
  const params = useParams({ from: '/episode/$id' })
  const episodeId = computed(() => params.value.id)
  const { data: episode } = useEpisode(episodeId)
  const seriesId = computed(() => episode.value?.seriesId ?? '')
  return { episodeId, episode, seriesId }
}
