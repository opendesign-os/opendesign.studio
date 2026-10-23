<script setup lang="ts">
import { Check, X } from '@lucide/vue'
import type { Requirement } from '@opendesign/models'
import { cn } from '@opendesign/shadcn'

defineProps<{ items: Requirement[] }>()
</script>

<template>
  <ul class="space-y-1.5">
    <li v-for="item in items" :key="item.id" class="flex items-start gap-2">
      <span
        :class="
          cn(
            'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full',
            item.ok ? 'bg-success/20 text-success' : 'bg-container/20 text-container',
          )
        "
      >
        <Check v-if="item.ok" class="size-2.5" />
        <X v-else class="size-2.5" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-data" :class="{ 'font-medium': !item.ok }">
          {{ item.label }}
        </span>
        <span v-if="!item.ok" class="text-muted-foreground block text-meta leading-snug">
          {{ item.hint }}
        </span>
      </span>
    </li>
  </ul>
</template>
