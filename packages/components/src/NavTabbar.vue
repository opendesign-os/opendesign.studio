<script setup lang="ts" generic="T extends string">
import type { NavEntry } from './types'

defineProps<{ items: readonly NavEntry<T>[]; active?: string }>()

const emit = defineEmits<{ select: [path: T] }>()
</script>

<template>
  <nav class="bg-sidebar flex shrink-0 items-stretch border-t">
    <button
      v-for="item in items"
      :key="item.path"
      type="button"
      class="text-muted-foreground flex flex-1 flex-col items-center gap-1 py-2.5 text-xs"
      :class="active === item.path && 'text-sidebar-accent-foreground font-medium'"
      @click="emit('select', item.path)"
    >
      <component :is="item.icon" class="size-5" />
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>
