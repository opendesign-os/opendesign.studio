<script setup lang="ts">
import { useLocation, useRouter } from '@tanstack/vue-router'
import { menu } from '../menu'

const router = useRouter()
const location = useLocation()
</script>

<template>
  <nav class="bg-sidebar flex shrink-0 items-stretch border-t">
    <button
      v-for="item in menu"
      :key="item.path"
      type="button"
      class="text-muted-foreground flex flex-1 flex-col items-center gap-1 py-2.5 text-xs"
      :class="location.pathname === item.path && 'text-sidebar-accent-foreground font-medium'"
      @click="router.navigate({ to: item.path })"
    >
      <component :is="item.icon" class="size-5" />
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>
