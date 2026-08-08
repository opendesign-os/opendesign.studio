import './style.css'
import { type Platform, setPlatform } from '@opendesign/platform'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { RouterProvider } from '@tanstack/vue-router'
import { createApp, h } from 'vue'
import { queryClient, router } from './router'
import { restoreTheme } from './theme'

export function mountApp(selector: string, platform: Platform) {
  setPlatform(platform)
  void restoreTheme()

  createApp(() => h(RouterProvider, { router }))
    .use(VueQueryPlugin, { queryClient })
    .mount(selector)
}
