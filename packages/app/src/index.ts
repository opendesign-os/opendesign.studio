import './style.css'
import { type Platform, setPlatform } from '@opendesign/platform'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { RouterProvider } from '@tanstack/vue-router'
import { createApp, h } from 'vue'
import { queryClient, router } from './router'

export function mountApp(selector: string, platform: Platform) {
  setPlatform(platform)

  createApp(() => h(RouterProvider, { router }))
    .use(VueQueryPlugin, { queryClient })
    .mount(selector)
}
