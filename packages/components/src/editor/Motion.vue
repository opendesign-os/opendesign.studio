<script setup lang="ts">
import { ArrowLeftRight } from '@lucide/vue'
import type { Easing, Move } from '@opendesign/models'
import { cameraLabel, easingLabel, hasMotion } from '@opendesign/models'
import { Button, Input, ToggleGroup, ToggleGroupItem } from '@opendesign/shadcn'
import { computed } from 'vue'

const props = defineProps<{ move: Move }>()
const emit = defineEmits<{ change: [value: Move] }>()

const moving = computed(() => hasMotion(props.move))

const fields = [
  { key: 'x', label: 'X', step: 1 },
  { key: 'y', label: 'Y', step: 1 },
  { key: 'scale', label: '缩放', step: 0.05 },
] as const

function edit(key: 'from' | 'to', field: 'x' | 'y' | 'scale', raw: string | number) {
  const value = Number(raw)
  if (Number.isNaN(value)) return
  const next = field === 'scale' ? Math.min(4, Math.max(0.4, value)) : value
  emit('change', { ...props.move, [key]: { ...props.move[key], [field]: next } })
}

function ease(value: unknown) {
  if (typeof value === 'string' && value) emit('change', { ...props.move, easing: value as Easing })
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center gap-2">
      <span class="text-data">{{ cameraLabel[move.kind] }}</span>
      <span v-if="!moving" class="text-container text-meta">起落幅相同，画面不会动</span>
      <Button
        variant="ghost"
        size="xs"
        class="text-muted-foreground ml-auto"
        @click="emit('change', { ...move, from: move.to, to: move.from })"
      >
        <ArrowLeftRight />
        对调
      </Button>
    </div>

    <div class="grid grid-cols-[2.25rem_1fr_1fr_1fr] items-center gap-1.5">
      <span />
      <span v-for="field in fields" :key="field.key" class="text-muted-foreground text-center text-micro">
        {{ field.label }}
      </span>
      <template v-for="key in (['from', 'to'] as const)" :key="key">
        <span class="text-meta font-medium" :class="key === 'from' ? 'text-primary' : 'text-media'">
          {{ key === 'from' ? '起幅' : '落幅' }}
        </span>
        <Input
          v-for="field in fields"
          :key="field.key"
          :model-value="move[key][field.key]"
          type="number"
          :step="field.step"
          class="h-7 px-1.5 tabular-nums"
          @change="edit(key, field.key, ($event.target as HTMLInputElement).value)"
        />
      </template>
    </div>

    <div class="space-y-1.5">
      <p class="text-muted-foreground text-meta">缓动</p>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        class="w-full"
        :model-value="move.easing"
        @update:model-value="ease"
      >
        <ToggleGroupItem
          v-for="(label, value) in easingLabel"
          :key="value"
          :value="value"
          class="text-meta flex-1"
        >
          {{ label }}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  </div>
</template>
