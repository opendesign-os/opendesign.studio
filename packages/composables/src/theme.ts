import { createGlobalState, useDark } from '@vueuse/core'

export const useTheme = createGlobalState(() => ({ dark: useDark({ initialValue: 'light' }) }))
