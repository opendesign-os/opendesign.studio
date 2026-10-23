import './style.css'
import { auth, FetchError } from '@opendesign/queries'
import {
  MutationCache,
  notifyManager,
  QueryCache,
  QueryClient,
  VueQueryPlugin,
} from '@tanstack/vue-query'
import { RouterProvider } from '@tanstack/vue-router'
import { createApp, h } from 'vue'
import { router } from './router'

notifyManager.setScheduler(queueMicrotask)

function expire(error: Error) {
  if (error instanceof FetchError && error.status === 401) auth.$store.notify('$sessionSignal')
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: expire }),
  mutationCache: new MutationCache({ onError: expire }),
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 60_000 },
  },
})

createApp(() => h(RouterProvider, { router }))
  .use(VueQueryPlugin, { queryClient })
  .mount('#app')
