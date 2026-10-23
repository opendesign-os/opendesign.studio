import { useLocalStorage } from '@vueuse/core'

export const recent = useLocalStorage('recent-episode', '')
