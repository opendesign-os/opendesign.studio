import { createGlobalState, useDark, useToggle } from '@vueuse/core'

export const useTheme = createGlobalState(() => {
  const dark = useDark({ initialValue: 'light' })
  const toggle = useToggle(dark)
  return { dark, toggle }
})
