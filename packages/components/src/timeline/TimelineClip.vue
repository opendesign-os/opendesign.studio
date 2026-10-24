<script setup lang="ts">
import { cn } from '@opendesign/shadcn'
import { computed } from 'vue'
import { fills, type Tone } from '../common/tone'
import type { Clip } from './types'

const props = defineProps<{
  clip: Clip
  start: number
  span: number
  scale: number
  selected: boolean
  dragging: boolean
  handles: 'both' | 'end' | 'none'
}>()

const emit = defineEmits<{
  grab: [event: PointerEvent, mode: 'move' | 'start' | 'end']
  select: []
}>()

const GAP = 2
const TILE = 48

const film = computed(() => props.clip.kind === 'film')
const width = computed(() => Math.max(props.span * props.scale - GAP * 2, 10))
const roomy = computed(() => width.value >= 96)

const geometry = computed(() => ({
  left: `${props.start * props.scale + GAP}px`,
  width: `${width.value}px`,
}))

const seed = computed(() =>
  [...props.clip.id].reduce((total, char) => total + char.charCodeAt(0), 0),
)

const bars = computed(() => {
  const count = Math.max(4, Math.floor((width.value - 32) / 4))
  return Array.from({ length: count }, (_, index) => {
    const at = ((index + 0.5) / count) * props.span
    const wave = Math.abs(
      Math.sin(index * 0.9 + seed.value) * Math.cos(index * 0.37 + seed.value / 7),
    )
    const loud =
      !props.clip.audio ||
      props.clip.audio.some((item) => at >= item.start && at <= item.start + item.duration)
    return loud ? Math.round(24 + wave * 72) : 8
  })
})

const tiles = computed(() => Math.max(1, Math.ceil(width.value / TILE)))
const dots: Record<Tone, string> = { ...fills, neutral: 'bg-white/70' }

const head = computed(() => props.selected && props.handles === 'both')
const tail = computed(() => props.selected && props.handles !== 'none')
const grip = computed(() => (film.value ? 'w-3.5' : 'w-3'))
</script>

<template>
  <div
    role="button"
    tabindex="0"
    :aria-pressed="selected"
    :style="geometry"
    :class="
      cn(
        'group bg-card absolute inset-y-1 rounded-[10px] border select-none',
        selected
          ? cn('border-selection z-10', film ? 'border-x-[14px] border-y-[3px]' : 'border-x-[12px] border-y-2')
          : 'border-clip-border hover:border-muted-foreground/35',
        dragging ? 'z-20 shadow-lg' : 'shadow-xs transition-[border-color] duration-150',
      )
    "
    @pointerdown="emit('grab', $event, 'move')"
    @keydown.enter.prevent="emit('select')"
  >
    <div v-if="film" class="flex size-full flex-col gap-1 overflow-hidden rounded-[7px] p-1">
      <div class="relative min-h-0 flex-[3] overflow-hidden rounded-md">
        <div class="pointer-events-none absolute inset-0 flex gap-px" aria-hidden="true">
          <span
            v-for="index in tiles"
            :key="index"
            class="h-full shrink-0 bg-cover bg-center"
            :style="{ width: `${TILE}px`, backgroundImage: clip.cover }"
          />
        </div>
        <span
          class="text-micro pointer-events-none absolute top-1 left-1 flex max-w-[calc(100%-8px)] items-center gap-1 rounded-md bg-black/45 px-1.5 py-0.5 leading-3.5 text-white backdrop-blur-sm"
        >
          <span v-if="clip.tone" :class="cn('size-1.5 shrink-0 rounded-full', dots[clip.tone])" />
          <span class="shrink-0 font-semibold">{{ clip.badge }}</span>
          <span v-if="roomy" class="truncate opacity-85">{{ clip.name }}</span>
        </span>
      </div>
      <div
        :class="
          cn(
            'pointer-events-none flex min-h-0 flex-[2] items-center gap-[2px] overflow-hidden rounded-md px-1.5',
            selected ? 'bg-selection/12' : 'bg-muted',
          )
        "
        aria-hidden="true"
      >
        <span
          v-for="(height, index) in bars"
          :key="index"
          :class="cn('w-[2px] shrink-0 rounded-full', selected ? 'bg-selection' : 'bg-muted-foreground/55')"
          :style="{ height: `${height}%` }"
        />
      </div>
    </div>

    <div v-else class="pointer-events-none flex size-full overflow-hidden rounded-[7px] p-0.5">
      <div
        :class="
          cn(
            'flex min-w-0 flex-1 flex-col justify-center gap-0.5 rounded-md px-1.5',
            selected ? 'bg-selection/12 text-selection' : 'bg-muted text-muted-foreground',
          )
        "
      >
        <span class="text-micro truncate leading-3 font-medium">{{ clip.name }}</span>
        <span class="flex h-3.5 items-center gap-[2px] overflow-hidden" aria-hidden="true">
          <span
            v-for="(height, index) in bars"
            :key="index"
            :class="cn('w-[2px] shrink-0 rounded-full', selected ? 'bg-selection' : 'bg-muted-foreground/55')"
            :style="{ height: `${height}%` }"
          />
        </span>
      </div>
    </div>

    <span
      v-if="head"
      :class="cn('absolute inset-y-0 flex cursor-ew-resize items-center justify-center', grip, film ? '-left-3.5' : '-left-3')"
      @pointerdown.stop="emit('grab', $event, 'start')"
    >
      <span class="h-1/2 max-h-6 w-[3px] rounded-full bg-white" />
    </span>
    <span
      v-if="tail"
      :class="cn('absolute inset-y-0 flex cursor-ew-resize items-center justify-center', grip, film ? '-right-3.5' : '-right-3')"
      @pointerdown.stop="emit('grab', $event, 'end')"
    >
      <span class="h-1/2 max-h-6 w-[3px] rounded-full bg-white" />
    </span>
  </div>
</template>
