<script setup lang="ts" generic="T extends string">
import {
  cn,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@opendesign/shadcn'
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  options: Record<T, string>
  placeholder?: string
  class?: HTMLAttributes['class']
}>()

const value = defineModel<T>({ required: true })
</script>

<template>
  <Select v-model="value">
    <SelectTrigger size="sm" :class="cn('w-full', props.class)">
      <SelectValue :placeholder="placeholder" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="(label, key) in options" :key="key" :value="key">{{ label }}</SelectItem>
    </SelectContent>
  </Select>
</template>
