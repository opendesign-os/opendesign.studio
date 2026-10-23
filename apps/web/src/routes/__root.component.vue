<script setup lang="ts">
import { Monitor } from '@lucide/vue'
import { TooltipProvider } from '@opendesign/shadcn'
import { Outlet } from '@tanstack/vue-router'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

const narrow = useBreakpoints(breakpointsTailwind).smaller('md')
</script>

<template>
  <TooltipProvider :delay-duration="300">
    <div v-if="narrow" class="page-hint">
      <Monitor class="size-6" />
      <p>制作台需要更宽的屏幕</p>
    </div>
    <main v-else class="bg-background h-screen overflow-hidden">
      <Outlet />
    </main>
  </TooltipProvider>
</template>
