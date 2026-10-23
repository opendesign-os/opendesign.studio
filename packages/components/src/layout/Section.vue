<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import {
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
} from '@opendesign/shadcn'
import type { Component } from 'vue'

withDefaults(defineProps<{ title: string; icon?: Component; enabled?: boolean }>(), {
  icon: undefined,
  enabled: undefined,
})

const emit = defineEmits<{ toggle: [value: boolean] }>()
const open = defineModel<boolean>('open', { default: true })
</script>

<template>
  <Collapsible v-model:open="open" as="section" class="border-border border-b last:border-b-0">
    <div class="flex h-10 items-center gap-2 px-3">
      <Checkbox
        v-if="enabled !== undefined"
        :model-value="enabled"
        :aria-label="title"
        @update:model-value="emit('toggle', $event === true)"
      />
      <CollapsibleTrigger class="group flex min-w-0 flex-1 items-center gap-2 text-left">
        <component :is="icon" v-if="icon" class="text-muted-foreground size-3.5 shrink-0" />
        <span class="min-w-0 flex-1 truncate text-data font-medium">{{ title }}</span>
        <ChevronDown
          class="text-muted-foreground size-3.5 shrink-0 transition-transform duration-150 group-data-[state=closed]:-rotate-90"
        />
      </CollapsibleTrigger>
    </div>
    <CollapsibleContent
      :class="cn(enabled === false && 'pointer-events-none opacity-45 select-none')"
    >
      <div class="px-3 pb-3">
        <slot />
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>
