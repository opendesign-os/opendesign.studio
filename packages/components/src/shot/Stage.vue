<script setup lang="ts">
import { useTheme } from '@opendesign/composables'
import type { Asset, Frame, Shot, Slot } from '@opendesign/models'
import { interpolate } from '@opendesign/models'
import { media } from '@opendesign/queries'
import { cn } from '@opendesign/shadcn'
import { computed, ref, watch } from 'vue'
import { crop, plates } from './artwork'

const props = defineProps<{
  shot: Shot
  assets: Asset[]
  time: number
  playing: boolean
  volume: number
  rate: number
  framing: boolean
  selected: string | null
  captions: boolean
}>()

const emit = defineEmits<{
  frame: [slot: Slot, value: Frame]
  select: [id: string | null]
}>()

const ENTER = 0.45

const { dark } = useTheme()

const root = ref<HTMLElement | null>(null)

const layers = computed(() => plates(props.shot, dark.value))
const still = computed(() => {
  const key = props.shot.keyframes.find((item) => item.slot === 'first')?.image
  return key ? `url(${media(key)})` : undefined
})
const footage = computed(() => (props.shot.video ? media(props.shot.video) : undefined))
const clip = ref<HTMLVideoElement | null>(null)

watch(
  [() => props.volume, () => props.rate, clip],
  ([volume, rate, element]) => {
    if (!element) return
    element.volume = Math.min(1, Math.max(0, volume))
    element.muted = volume === 0
    element.playbackRate = rate
  },
  { immediate: true },
)

watch([() => props.time, () => props.playing, clip], ([time, playing, element]) => {
  if (!element) return
  if (playing) {
    if (element.paused) {
      element.currentTime = time
      void element.play()
    }
    return
  }
  element.pause()
  if (Math.abs(element.currentTime - time) > 0.05) element.currentTime = time
})
const editing = computed(() => props.framing && !props.playing)

const ink = computed(() => (dark.value ? 'text-white/40' : 'text-black/45'))

function transform(depth: number) {
  if (editing.value) return undefined
  const f = interpolate(props.shot.move, props.time, props.shot.duration, depth)
  return {
    transform: `translate(${-f.x * f.scale}%, ${-f.y * f.scale}%) scale(${f.scale})`,
  }
}

const entering = computed(() => {
  const kind = props.shot.transition
  if (!props.playing || kind === 'cut' || props.time >= ENTER) return null
  const t = Math.max(0, props.time / ENTER)
  if (kind === 'fade') return { veil: 'bg-black', opacity: 1 - t, picture: undefined }
  if (kind === 'flash') return { veil: 'bg-white', opacity: 1 - t, picture: undefined }
  if (kind === 'wipe') {
    return { veil: '', opacity: 0, picture: { clipPath: `inset(0 ${(1 - t) * 100}% 0 0)` } }
  }
  return { veil: '', opacity: 0, picture: { transform: `translateX(${(1 - t) * 100}%)` } }
})

const frames = computed(() =>
  (['from', 'to'] as const).map((key) => ({
    key,
    slot: (key === 'from' ? 'first' : 'last') as Slot,
    label: key === 'from' ? '起幅' : '落幅',
    value: props.shot.move[key],
    box: crop(props.shot.move[key]),
  })),
)

function showing(item: { start: number; duration: number }) {
  return props.time >= item.start && props.time <= item.start + item.duration
}

const caption = computed(() =>
  props.captions ? props.shot.dialogue.find(showing)?.line : undefined,
)

function frame(event: PointerEvent, slot: Slot, key: 'from' | 'to', handle: boolean) {
  const el = root.value
  if (!el || !editing.value) return
  event.preventDefault()
  event.stopPropagation()

  const rect = el.getBoundingClientRect()
  const origin = { ...props.shot.move[key] }
  const startX = event.clientX
  const startY = event.clientY

  const move = (next: PointerEvent) => {
    const dx = ((next.clientX - startX) / rect.width) * 100
    const dy = ((next.clientY - startY) / rect.height) * 100
    if (handle) {
      const scale = Math.min(4, Math.max(0.4, origin.scale - (dx + dy) / 80))
      emit('frame', slot, { ...origin, scale: Math.round(scale * 100) / 100 })
      return
    }
    emit('frame', slot, {
      ...origin,
      x: Math.round((origin.x + dx) * 10) / 10,
      y: Math.round((origin.y + dy) * 10) / 10,
    })
  }

  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', () => window.removeEventListener('pointermove', move), {
    once: true,
  })
}
</script>

<template>
  <div
    ref="root"
    class="@container-size relative size-full rounded-[inherit] select-none"
    @click="emit('select', null)"
  >
    <div class="bg-stage absolute inset-0 overflow-hidden rounded-[inherit]">
      <div class="absolute inset-0" :style="entering?.picture">
        <video
          v-if="footage && !editing"
          ref="clip"
          :src="footage"
          class="absolute inset-0 size-full object-cover"
          playsinline
          preload="auto"
        />
        <div
          v-else-if="still"
          class="absolute inset-0 origin-center bg-cover bg-center"
          :style="{ backgroundImage: still, ...transform(1) }"
        />
        <template v-else>
          <div
            v-for="plate in layers"
            :key="plate.layer.plane"
            class="absolute inset-0 origin-center"
            :class="plate.layer.hidden && 'hidden'"
            :style="{ backgroundImage: plate.image, ...transform(plate.layer.depth) }"
          />

          <div class="absolute inset-0 origin-center" :style="transform(1)">
            <p
              class="absolute inset-x-[8%] top-1/2 -translate-y-1/2 text-center text-[1.6cqmin] leading-relaxed"
              :class="ink"
            >
              {{ shot.prompt }}
            </p>
          </div>
        </template>
      </div>

      <div :class="cn('absolute inset-0', editing && 'pointer-events-none opacity-40')">
        <p
          v-if="caption"
          class="pointer-events-none absolute inset-x-[8%] bottom-[6%] text-center text-[3.4cqmin] leading-snug font-semibold text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.9),0_0_10px_rgb(0_0_0/0.45)]"
        >
          {{ caption }}
        </p>
      </div>

      <div
        v-if="entering?.veil"
        class="pointer-events-none absolute inset-0"
        :class="entering.veil"
        :style="{ opacity: entering.opacity }"
      />
      <div v-if="editing" class="bg-shade/15 pointer-events-none absolute inset-0" />
    </div>

    <template v-if="editing">
      <div
        v-for="entry in frames"
        :key="entry.key"
        :class="
          cn(
            'absolute cursor-move',
            entry.key === 'from'
              ? 'border-primary border-2'
              : 'border-media border-2 border-dashed',
          )
        "
        :style="entry.box"
        @pointerdown="frame($event, entry.slot, entry.key, false)"
        @click.stop
      >
        <span
          class="absolute left-0 rounded px-1 text-micro font-medium text-white"
          :class="entry.key === 'from' ? 'bg-primary -top-5' : 'bg-media -bottom-5'"
        >
          {{ entry.label }} · {{ entry.value.scale.toFixed(2) }}×
        </span>
        <span
          class="absolute -right-1.5 -bottom-1.5 size-3 cursor-nwse-resize rounded-sm border-2 border-white"
          :class="entry.key === 'from' ? 'bg-primary' : 'bg-media'"
          @pointerdown.stop="frame($event, entry.slot, entry.key, true)"
        />
      </div>
    </template>
  </div>
</template>
