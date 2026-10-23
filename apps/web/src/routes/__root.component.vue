<script setup lang="ts">
import { Monitor } from '@lucide/vue'
import { auth } from '@opendesign/queries'
import { TooltipProvider } from '@opendesign/shadcn'
import { Outlet, useRouter, useRouterState } from '@tanstack/vue-router'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { type ComputedRef, computed, type Ref, watchEffect } from 'vue'

const narrow = useBreakpoints(breakpointsTailwind).smaller('md')
const session = auth.useSession()
const router = useRouter()
const entry: Readonly<Ref<boolean>> = useRouterState({
  select: (state) => state.matches.some((match) => match.routeId === '/login'),
})
const ready: ComputedRef<boolean> = computed(
  () => !session.value.isPending && Boolean(session.value.data) !== entry.value,
)

watchEffect(() => {
  if (session.value.isPending || ready.value) return
  void router.navigate({ to: entry.value ? '/' : '/login' })
})
</script>

<template>
  <TooltipProvider :delay-duration="300">
    <div v-if="narrow" class="page-hint">
      <Monitor class="size-6" />
      <p>制作台需要更宽的屏幕</p>
    </div>
    <main v-else class="bg-background h-screen overflow-hidden">
      <Outlet v-if="ready" />
    </main>
  </TooltipProvider>
</template>
