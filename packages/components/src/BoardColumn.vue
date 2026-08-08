<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  count: number
  icon: Component
  tone?: string
  surface?: string
}>()
</script>

<template>
  <section class="flex w-[17.5rem] shrink-0 flex-col">
    <header
      class="flex items-center gap-2 rounded-xl px-3 py-2"
      :class="surface ?? 'bg-muted'"
    >
      <span class="h-4 w-0.5 shrink-0 rounded-full bg-current" :class="tone" />
      <component :is="icon" class="size-3.5" :class="tone" />
      <span class="text-sm font-medium">{{ label }}</span>
      <span class="text-muted-foreground ml-auto text-xs tabular-nums">{{ count }}</span>
    </header>

    <div class="scroll-surface mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 pb-4">
      <slot />
    </div>
  </section>
</template>
