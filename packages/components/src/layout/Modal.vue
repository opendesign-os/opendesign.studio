<script setup lang="ts" generic="T extends string">
import { cn, Dialog, DialogContent, DialogDescription, DialogTitle } from '@opendesign/shadcn'
import type { HTMLAttributes } from 'vue'

const props = defineProps<{ name: T; title: string; class?: HTMLAttributes['class'] }>()

const model = defineModel<T | null>({ required: true })
</script>

<template>
  <Dialog :open="model === name" @update:open="(open) => (model = open ? name : null)">
    <DialogContent
      :class="cn('flex max-h-[85vh] flex-col gap-0 overflow-hidden rounded-xl p-0', props.class)"
    >
      <DialogTitle class="sr-only">{{ title }}</DialogTitle>
      <DialogDescription class="sr-only">{{ title }}</DialogDescription>
      <slot />
    </DialogContent>
  </Dialog>
</template>
