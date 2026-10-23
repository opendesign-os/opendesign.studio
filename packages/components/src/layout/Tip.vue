<script setup lang="ts">
import { Tooltip, TooltipContent, TooltipTrigger } from '@opendesign/shadcn'

defineProps<{ label: string; shortcut?: string; side?: 'top' | 'right' | 'bottom' | 'left' }>()
</script>

<template>
  <Tooltip>
    <TooltipTrigger as-child :aria-label="label">
      <slot />
    </TooltipTrigger>
    <TooltipContent :side="side" class="flex items-center gap-2">
      <slot name="content">
        {{ label }}
        <kbd v-if="shortcut" class="font-mono text-micro opacity-60">{{ shortcut }}</kbd>
      </slot>
    </TooltipContent>
  </Tooltip>
</template>
