<script setup lang="ts">
import { Eye, EyeOff } from '@lucide/vue'
import type { Layer, Plane } from '@opendesign/models'
import { planeLabel } from '@opendesign/models'
import { Slider } from '@opendesign/shadcn'
import Tip from '../layout/Tip.vue'

const props = defineProps<{ layers: Layer[] }>()
const emit = defineEmits<{ change: [value: Layer[]] }>()

function depth(plane: Plane, value: number[] | undefined) {
  const next = value?.[0]
  if (next === undefined) return
  emit(
    'change',
    props.layers.map((item) => (item.plane === plane ? { ...item, depth: next } : item)),
  )
}

function toggle(plane: Plane) {
  emit(
    'change',
    props.layers.map((item) => (item.plane === plane ? { ...item, hidden: !item.hidden } : item)),
  )
}
</script>

<template>
  <div class="space-y-3">
    <div v-for="layer in layers" :key="layer.plane" class="flex items-center gap-2.5">
      <Tip :label="layer.hidden ? '显示图层' : '隐藏图层'">
        <button
          type="button"
          class="text-muted-foreground hover:text-foreground flex size-6 shrink-0 items-center justify-center rounded transition-colors duration-150"
          @click="toggle(layer.plane)"
        >
          <EyeOff v-if="layer.hidden" class="size-3.5" />
          <Eye v-else class="size-3.5" />
        </button>
      </Tip>
      <span class="w-8 shrink-0 text-data">{{ planeLabel[layer.plane] }}</span>
      <Slider
        class="min-w-0 flex-1"
        :model-value="[layer.depth]"
        :min="0"
        :max="1"
        :step="0.05"
        :disabled="layer.hidden"
        @update:model-value="depth(layer.plane, $event)"
      />
      <span class="text-muted-foreground w-8 shrink-0 text-right font-mono text-meta tabular-nums">
        {{ layer.depth.toFixed(2) }}
      </span>
    </div>
    <p class="text-muted-foreground text-meta leading-snug">
      数值越小跟随镜头越慢，把背景压低就能拉出景深
    </p>
  </div>
</template>
