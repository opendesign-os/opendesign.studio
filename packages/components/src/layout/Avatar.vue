<script setup lang="ts">
import { cn } from '@opendesign/shadcn'
import type { HTMLAttributes } from 'vue'

const props = defineProps<{ name?: string; color?: string; class?: HTMLAttributes['class'] }>()
</script>

<template>
  <span
    :class="
      cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none',
        props.class,
      )
    "
    :style="{ backgroundColor: color }"
  >
    {{ name?.slice(0, 1) }}
  </span>
</template>
