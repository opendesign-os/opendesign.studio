import { getPlatform } from '@opendesign/platform'
import { ref } from 'vue'

const STORAGE_KEY = 'ui.dark'

export const dark = ref(false)

function apply(value: boolean) {
  dark.value = value
  document.documentElement.classList.toggle('dark', value)
}

export async function restoreTheme() {
  const stored = await getPlatform().store.get<boolean>(STORAGE_KEY)
  apply(stored ?? window.matchMedia('(prefers-color-scheme: dark)').matches)
}

export async function toggleTheme() {
  apply(!dark.value)
  await getPlatform().store.set(STORAGE_KEY, dark.value)
}
