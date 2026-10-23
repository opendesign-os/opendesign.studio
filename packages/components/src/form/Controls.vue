<script setup lang="ts">
import type { Control, Setting } from '@opendesign/models'
import { Input, Slider, Switch, ToggleGroup, ToggleGroupItem } from '@opendesign/shadcn'

const props = defineProps<{ controls: Control[]; values: Record<string, Setting> }>()

const emit = defineEmits<{ change: [key: string, value: Setting] }>()

function read(control: Control) {
  const value = props.values[control.key]
  return typeof value === typeof control.value ? (value as Setting) : control.value
}

function digits(step: number) {
  return String(step).split('.')[1]?.length ?? 0
}

function slide(key: string, value: number[] | undefined) {
  const next = value?.[0]
  if (next !== undefined) emit('change', key, next)
}

function pick(key: string, value: unknown) {
  if (typeof value === 'string' && value) emit('change', key, value)
}

function write(key: string, raw: string) {
  const value = raw.trim()
  if (value) emit('change', key, value)
}

function type(control: Control & { type: 'number' }, raw: string) {
  const value = Number(raw)
  if (Number.isFinite(value)) {
    emit('change', control.key, Math.min(control.max, Math.max(control.min, Math.round(value))))
  }
}
</script>

<template>
  <div class="divide-border divide-y">
    <div v-for="control in controls" :key="control.key" class="flex items-center gap-4 py-2.5">
      <div class="min-w-0 flex-1">
        <p class="text-data">{{ control.label }}</p>
        <p v-if="control.hint" class="text-muted-foreground mt-0.5 text-micro">{{ control.hint }}</p>
      </div>

      <template v-if="control.type === 'range'">
        <Slider
          class="w-36"
          :model-value="[Number(read(control))]"
          :min="control.min"
          :max="control.max"
          :step="control.step"
          :aria-label="control.label"
          @update:model-value="slide(control.key, $event)"
        />
        <span class="text-muted-foreground w-14 text-right font-mono text-meta tabular-nums">
          {{ Number(read(control)).toFixed(digits(control.step)) }}{{ control.unit ?? '' }}
        </span>
      </template>

      <ToggleGroup
        v-else-if="control.type === 'choice'"
        type="single"
        variant="outline"
        size="sm"
        :model-value="String(read(control))"
        @update:model-value="pick(control.key, $event)"
      >
        <ToggleGroupItem
          v-for="(label, value) in control.options"
          :key="value"
          :value="value"
          class="text-meta px-2.5"
        >
          {{ label }}
        </ToggleGroupItem>
      </ToggleGroup>

      <Switch
        v-else-if="control.type === 'toggle'"
        :model-value="Boolean(read(control))"
        :aria-label="control.label"
        @update:model-value="emit('change', control.key, $event)"
      />

      <Input
        v-else-if="control.type === 'number'"
        type="number"
        class="w-36 font-mono tabular-nums"
        :model-value="Number(read(control))"
        :min="control.min"
        :max="control.max"
        @change="type(control, ($event.target as HTMLInputElement).value)"
      />

      <Input
        v-else
        class="w-36 font-mono"
        :model-value="String(read(control))"
        @change="write(control.key, ($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>
