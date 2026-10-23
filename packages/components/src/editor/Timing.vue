<script setup lang="ts">
import { tenth } from '@opendesign/common'
import type { ShotPatch, Transition } from '@opendesign/models'
import { MAX_DURATION, MIN_DURATION, transitionLabel } from '@opendesign/models'
import { Input, ToggleGroup, ToggleGroupItem } from '@opendesign/shadcn'

defineProps<{ duration: number; transition: Transition }>()

const emit = defineEmits<{ change: [patch: Pick<ShotPatch, 'duration' | 'transition'>] }>()

function commit(raw: string) {
  const value = Number(raw)
  if (!Number.isNaN(value)) {
    emit('change', { duration: tenth(Math.min(MAX_DURATION, Math.max(MIN_DURATION, value))) })
  }
}

function pick(value: unknown) {
  if (typeof value === 'string' && value) emit('change', { transition: value as Transition })
}
</script>

<template>
  <div class="space-y-3">
    <label class="flex items-center gap-2">
      <span class="text-muted-foreground text-meta w-14 shrink-0">时长</span>
      <Input
        :model-value="duration"
        type="number"
        step="0.1"
        :min="MIN_DURATION"
        :max="MAX_DURATION"
        class="h-7 w-20 font-mono tabular-nums"
        @change="commit(($event.target as HTMLInputElement).value)"
      />
      <span class="text-muted-foreground text-meta">秒 · 时间轴上拖右缘也能改</span>
    </label>

    <div class="space-y-1.5">
      <p class="text-muted-foreground text-meta">入场转场</p>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        :spacing="1"
        class="grid w-full grid-cols-3 gap-1.5"
        :model-value="transition"
        @update:model-value="pick"
      >
        <ToggleGroupItem
          v-for="(label, value) in transitionLabel"
          :key="value"
          :value="value"
          class="text-meta data-[state=on]:border-selection data-[state=on]:bg-selection/10 data-[state=on]:text-selection"
        >
          {{ label }}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  </div>
</template>
