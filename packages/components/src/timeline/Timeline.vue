<script setup lang="ts">
import { Eye, EyeOff, Lock, LockOpen } from '@lucide/vue'
import { clock } from '@opendesign/common'
import { cn } from '@opendesign/shadcn'
import { computed, onUnmounted, ref, watch } from 'vue'
import Tip from '../layout/Tip.vue'
import TimelineClip from './TimelineClip.vue'
import type { Clip, Track } from './types'

const props = defineProps<{
  tracks: Track[]
  duration: number
  time: number
  scale: number
  snap: boolean
  selected: string[]
}>()

const emit = defineEmits<{
  seek: [time: number]
  select: [id: string]
  retime: [id: string, start: number, duration: number]
  mark: [id: string]
  zoom: [scale: number]
  toggle: [id: string, flag: 'hidden' | 'locked']
}>()

type Mode = 'move' | 'start' | 'end'

type Drag = {
  id: string
  mode: Mode
  track: Track
  originX: number
  originStart: number
  originSpan: number
  start: number
  span: number
  guide: number | null
  moved: boolean
}

const MIN_SPAN = 4 / 30
const GUTTER = 96
const TAIL = 160
const STEPS = [1, 2, 5, 10, 15, 30, 60]

const heights: Record<Clip['kind'], number> = { film: 92, audio: 48 }

const scroller = ref<HTMLElement | null>(null)
const lanes = ref<HTMLElement | null>(null)
const drag = ref<Drag | null>(null)
let settling = false

const laneWidth = computed(() => `${props.duration * props.scale + TAIL}px`)
const major = computed(() => STEPS.find((value) => value * props.scale >= 80) ?? 60)
const minor = computed(() => major.value / (major.value >= 5 ? 5 : 4))

const labels = computed(() =>
  Array.from({ length: Math.floor(props.duration / major.value) + 1 }, (_, index) => {
    const seconds = index * major.value
    return { seconds, text: clock(seconds) }
  }),
)

const ticks = computed(() => {
  const ratio = Math.round(major.value / minor.value)
  return Array.from({ length: Math.floor(props.duration / minor.value) + 1 }, (_, index) => index)
    .filter((index) => index % ratio !== 0)
    .map((index) => index * minor.value)
})

function shift(at: number, track: Track) {
  const current = drag.value
  if (!current || !track.sequential || current.track.id !== track.id) return 0
  return at > current.originStart ? current.span - current.originSpan : 0
}

function startOf(clip: Clip, track: Track) {
  const current = drag.value
  if (current?.id === clip.id) return current.start
  return clip.start + shift(clip.start, track)
}

function spanOf(clip: Clip) {
  return drag.value?.id === clip.id ? drag.value.span : clip.duration
}

function handlesOf(track: Track) {
  if (track.locked) return 'none'
  return track.sequential ? 'end' : 'both'
}

function positionAt(clientX: number) {
  const el = lanes.value
  if (!el) return 0
  const at = (clientX - el.getBoundingClientRect().left) / props.scale
  return Math.min(props.duration, Math.max(0, at))
}

function edges(current: Drag) {
  const points = current.track.sequential ? [0, props.time] : [0, props.duration, props.time]
  for (const track of props.tracks) {
    for (const clip of track.clips) {
      if (clip.id === current.id) continue
      if (track.sequential && track.id === current.track.id && clip.start > current.originStart) {
        continue
      }
      points.push(clip.start, clip.start + clip.duration)
    }
  }
  return points
}

function nearest(value: number, points: number[]) {
  if (!props.snap) return null
  let best: number | null = null
  let distance = 8 / props.scale
  for (const point of points) {
    const delta = Math.abs(point - value)
    if (delta < distance) {
      distance = delta
      best = point
    }
  }
  return best
}

function settle() {
  settling = true
  setTimeout(() => {
    settling = false
  })
}

function grab(event: PointerEvent, mode: Mode, clip: Clip, track: Track) {
  event.preventDefault()
  if (track.locked || (track.sequential && mode === 'move')) {
    emit('select', clip.id)
    return
  }
  settling = true
  drag.value = {
    id: clip.id,
    mode,
    track,
    originX: event.clientX,
    originStart: clip.start,
    originSpan: clip.duration,
    start: clip.start,
    span: clip.duration,
    guide: null,
    moved: false,
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onRelease, { once: true })
}

function onMove(event: PointerEvent) {
  const current = drag.value
  if (!current) return
  if (Math.abs(event.clientX - current.originX) > 3) current.moved = true

  const delta = (event.clientX - current.originX) / props.scale
  const points = edges(current)

  if (current.mode === 'move') {
    const raw = Math.max(0, current.originStart + delta)
    const head = nearest(raw, points)
    const tail = nearest(raw + current.originSpan, points)
    const headOff = head === null ? Number.POSITIVE_INFINITY : Math.abs(head - raw)
    const tailOff =
      tail === null ? Number.POSITIVE_INFINITY : Math.abs(tail - raw - current.originSpan)

    if (headOff <= tailOff && head !== null) {
      current.start = Math.max(0, head)
      current.guide = head
    } else if (tail !== null) {
      current.start = Math.max(0, tail - current.originSpan)
      current.guide = tail
    } else {
      current.start = raw
      current.guide = null
    }
    return
  }

  if (current.mode === 'start') {
    const limit = current.originStart + current.originSpan - MIN_SPAN
    const raw = Math.min(limit, Math.max(0, current.originStart + delta))
    const snapped = nearest(raw, points)
    const next = Math.min(limit, Math.max(0, snapped ?? raw))
    current.start = next
    current.span = current.originStart + current.originSpan - next
    current.guide = snapped
    return
  }

  const floor = current.originStart + MIN_SPAN
  const raw = Math.max(floor, current.originStart + current.originSpan + delta)
  const snapped = nearest(raw, points)
  const next = Math.max(floor, snapped ?? raw)
  current.span = next - current.originStart
  current.guide = snapped
}

function onRelease() {
  window.removeEventListener('pointermove', onMove)
  const current = drag.value
  drag.value = null
  if (!current) return

  settle()

  if (!current.moved) {
    emit('select', current.id)
    return
  }

  emit('retime', current.id, current.start, current.span)
}

function scrub(event: PointerEvent) {
  event.preventDefault()
  emit('seek', positionAt(event.clientX))

  const follow = (next: PointerEvent) => emit('seek', positionAt(next.clientX))

  window.addEventListener('pointermove', follow)
  window.addEventListener('pointerup', () => window.removeEventListener('pointermove', follow), {
    once: true,
  })
}

function seek(event: MouseEvent) {
  if (settling || drag.value) return
  emit('seek', positionAt(event.clientX))
}

function wheel(event: WheelEvent) {
  if (!event.ctrlKey && !event.metaKey) return
  event.preventDefault()
  emit('zoom', props.scale * (event.deltaY < 0 ? 1.12 : 1 / 1.12))
}

watch(
  () => props.time,
  (value) => {
    const el = scroller.value
    if (!el || drag.value) return
    const x = value * props.scale
    const view = el.clientWidth - GUTTER
    if (x < el.scrollLeft || x > el.scrollLeft + view - 16) {
      el.scrollLeft = Math.max(0, x - view * 0.25)
    }
  },
)

onUnmounted(() => window.removeEventListener('pointermove', onMove))
</script>

<template>
  <div
    ref="scroller"
    class="bg-background relative min-h-0 flex-1 overflow-auto select-none"
    @wheel="wheel"
  >
    <div class="flex min-h-full w-max min-w-full">
      <div class="bg-background border-border/70 sticky left-0 z-40 flex w-24 shrink-0 flex-col border-r">
        <div class="bg-background sticky top-0 z-10 h-8 shrink-0" />
        <div
          v-for="track in tracks"
          :key="track.id"
          class="group/track flex shrink-0 items-center gap-1.5 px-2.5"
          :style="{ height: `${heights[track.kind]}px` }"
        >
          <component
            :is="track.icon"
            v-if="track.icon"
            class="text-muted-foreground size-3.5 shrink-0"
          />
          <span class="text-muted-foreground text-meta min-w-0 flex-1 truncate">
            {{ track.label }}
          </span>
          <Tip :label="track.hidden ? '显示轨道' : '隐藏轨道'">
            <button
              type="button"
              :class="
                cn(
                  'text-muted-foreground hover:text-foreground size-5 shrink-0 items-center justify-center rounded transition-colors duration-150',
                  track.hidden ? 'flex' : 'hidden group-hover/track:flex',
                )
              "
              @click="emit('toggle', track.id, 'hidden')"
            >
              <EyeOff v-if="track.hidden" class="size-3" />
              <Eye v-else class="size-3" />
            </button>
          </Tip>
          <Tip :label="track.locked ? '解锁轨道' : '锁定轨道'">
            <button
              type="button"
              :class="
                cn(
                  'text-muted-foreground hover:text-foreground size-5 shrink-0 items-center justify-center rounded transition-colors duration-150',
                  track.locked ? 'flex' : 'hidden group-hover/track:flex',
                )
              "
              @click="emit('toggle', track.id, 'locked')"
            >
              <Lock v-if="track.locked" class="size-3" />
              <LockOpen v-else class="size-3" />
            </button>
          </Tip>
        </div>
      </div>

      <div ref="lanes" class="relative flex-1" :style="{ minWidth: laneWidth }">
        <div class="bg-background sticky top-0 z-20 h-8 cursor-ew-resize" @pointerdown="scrub">
          <span
            v-for="at in ticks"
            :key="`tick-${at}`"
            class="bg-muted-foreground/30 pointer-events-none absolute top-1/2 h-1.5 w-px -translate-y-1/2"
            :style="{ left: `${at * scale}px` }"
          />
          <span
            v-for="label in labels"
            :key="label.seconds"
            :class="
              cn(
                'text-muted-foreground text-meta pointer-events-none absolute top-1/2 -translate-y-1/2 font-semibold tabular-nums',
                label.seconds > 0 && '-translate-x-1/2',
              )
            "
            :style="{ left: `${label.seconds * scale}px` }"
          >
            {{ label.text }}
          </span>
        </div>

        <div
          v-for="track in tracks"
          :key="track.id"
          class="relative"
          :class="track.hidden && 'opacity-40'"
          :style="{ height: `${heights[track.kind]}px` }"
          @click="seek"
        >
          <TimelineClip
            v-for="clip in track.clips"
            :key="clip.id"
            :clip="clip"
            :start="startOf(clip, track)"
            :span="spanOf(clip)"
            :scale="scale"
            :selected="selected.includes(clip.id)"
            :dragging="drag?.id === clip.id"
            :handles="handlesOf(track)"
            @grab="(event, mode) => grab(event, mode, clip, track)"
            @select="emit('select', clip.id)"
          />

          <button
            v-for="mark in track.marks ?? []"
            :key="mark.id"
            type="button"
            :title="mark.label"
            :class="
              cn(
                'bg-card absolute top-1/2 z-[15] -translate-x-1/2 -translate-y-1/2 border shadow-xs transition-colors duration-150',
                mark.muted
                  ? 'border-border hover:border-primary/50 size-2.5 rounded-full'
                  : 'border-primary/25 text-primary text-micro h-5 rounded-full px-2 leading-none font-semibold',
              )
            "
            :style="{ left: `${(mark.at + shift(mark.at, track)) * scale}px` }"
            @pointerdown.stop
            @click.stop="emit('mark', mark.id)"
          >
            <template v-if="!mark.muted">{{ mark.label }}</template>
          </button>
        </div>

        <div
          v-if="drag?.guide !== null && drag?.guide !== undefined"
          class="bg-selection pointer-events-none absolute top-8 bottom-0 z-30 w-px"
          :style="{ left: `${drag.guide * scale}px` }"
        />

        <div
          class="pointer-events-none absolute top-0 bottom-0 z-30"
          :style="{ left: `${time * scale}px` }"
        >
          <span class="bg-playhead absolute top-0 bottom-0 -left-px w-0.5" />
          <span
            class="bg-playhead pointer-events-auto absolute top-1.5 -left-[6px] h-5 w-3 cursor-ew-resize rounded-full shadow-sm"
            @pointerdown.stop="scrub"
          />
        </div>
      </div>
    </div>
  </div>
</template>
