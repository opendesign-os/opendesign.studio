import './style.css'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { RouterProvider } from '@tanstack/vue-router'
import { createApp, h } from 'vue'
import { queryClient, router } from './router'

createApp(() => h(RouterProvider, { router }))
  .use(VueQueryPlugin, { queryClient })
  .mount('#app')
