<script setup lang="ts">
import { cn } from '@opendesign/shadcn'
import { ref, useTemplateRef, watch } from 'vue'
import Avatar from '../layout/Avatar.vue'
import type { Choice } from './types'

defineOptions({ inheritAttrs: false })

const props = defineProps<{ items: Choice[]; command: (item: Choice) => void }>()

const index = ref(0)
const list = useTemplateRef<HTMLElement>('list')

watch(
  () => props.items,
  () => {
    index.value = 0
    list.value?.scrollTo({ top: 0 })
  },
  { flush: 'post' },
)

watch(
  index,
  (value) => {
    if (!value) list.value?.scrollTo({ top: 0 })
    else list.value?.querySelectorAll('button')[value]?.scrollIntoView({ block: 'nearest' })
  },
  { flush: 'post' },
)

function keydown(event: KeyboardEvent) {
  const count = props.items.length
  if (!count) return false
  if (event.key === 'ArrowDown') {
    index.value = (index.value + 1) % count
    return true
  }
  if (event.key === 'ArrowUp') {
    index.value = (index.value + count - 1) % count
    return true
  }
  if (event.key === 'Enter' || event.key === 'Tab') {
    const item = props.items[index.value]
    if (item) props.command(item)
    return true
  }
  return false
}

defineExpose({ keydown })
</script>

<template>
  <div
    ref="list"
    class="bg-popover text-popover-foreground border-border max-h-80 w-64 overflow-y-auto rounded-lg border p-1 shadow-lg"
  >
    <template v-for="(item, position) in items" :key="item.id">
      <p
        v-if="item.group && item.group !== items[position - 1]?.group"
        class="text-muted-foreground px-2 pt-2 pb-1 text-micro font-medium first:pt-1"
      >
        {{ item.group }}
      </p>
      <button
        type="button"
        :class="
          cn(
            'text-data flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left',
            position === index ? 'bg-accent' : 'hover:bg-accent/60',
          )
        "
        @mouseenter="index = position"
        @mousedown.prevent="command(item)"
      >
        <span
          v-if="item.icon"
          class="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md"
        >
          <component :is="item.icon" class="size-4" />
        </span>
        <Avatar
          v-else-if="item.color"
          :name="item.label"
          :color="item.color"
          class="text-micro size-6"
        />
        <span class="min-w-0 flex-1">
          <span class="block truncate">{{ item.label }}</span>
          <span v-if="item.hint" class="text-muted-foreground block truncate text-micro">{{ item.hint }}</span>
        </span>
      </button>
    </template>
    <p v-if="!items.length" class="text-muted-foreground px-2 py-1.5 text-meta">没有匹配项</p>
  </div>
</template>
