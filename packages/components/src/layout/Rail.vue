<script setup lang="ts">
import { cn } from '@opendesign/shadcn'
import { computed } from 'vue'
import Tip from './Tip.vue'
import type { Destination } from './types'

const props = defineProps<{ entries: Destination[]; active: string }>()
const emit = defineEmits<{ select: [id: string] }>()

const groups = computed(() => {
  const map = new Map<string, Destination[]>()
  for (const entry of props.entries) {
    const key = entry.group ?? ''
    map.set(key, [...(map.get(key) ?? []), entry])
  }
  return [...map.values()]
})
</script>

<template>
  <nav class="bg-sidebar border-sidebar-border flex w-14 shrink-0 flex-col items-center border-r py-2">
    <template v-for="(group, index) in groups" :key="index">
      <span v-if="index > 0" class="bg-sidebar-border my-1.5 h-px w-6 shrink-0" />
      <ul class="flex shrink-0 flex-col items-center gap-1">
        <li v-for="entry in group" :key="entry.id">
          <Tip :label="entry.label" side="right">
              <button
                type="button"
                :aria-current="entry.id === active ? 'page' : undefined"
                :class="
                  cn(
                    'relative flex size-9 items-center justify-center rounded-lg transition-colors duration-150',
                    entry.id === active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
                  )
                "
                @click="emit('select', entry.id)"
              >
                <component :is="entry.icon" class="size-[18px]" />
              </button>
          </Tip>
        </li>
      </ul>
    </template>

    <div class="mt-auto flex w-full shrink-0 flex-col items-center gap-1">
      <slot name="footer" />
    </div>
  </nav>
</template>
