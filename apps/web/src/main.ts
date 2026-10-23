import './style.css'
import { notifyManager, QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { RouterProvider } from '@tanstack/vue-router'
import { createApp, h } from 'vue'
import { router } from './router'

notifyManager.setScheduler(queueMicrotask)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 60_000 },
  },
})

createApp(() => h(RouterProvider, { router }))
  .use(VueQueryPlugin, { queryClient })
  .mount('#app')
