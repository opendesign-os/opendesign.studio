<script setup lang="ts">
import { useTheme } from '@opendesign/composables'
import type { Asset, Frame, Shot, Slot } from '@opendesign/models'
import { interpolate } from '@opendesign/models'
import { cn } from '@opendesign/shadcn'
import { computed, ref } from 'vue'
import { crop, plates } from './artwork'

const props = defineProps<{
  shot: Shot
  assets: Asset[]
  time: number
  playing: boolean
  framing: boolean
  selected: string | null
  captions: boolean
}>()

const emit = defineEmits<{
  frame: [slot: Slot, value: Frame]
  shift: [id: string, x: number, y: number]
  select: [id: string | null]
}>()

const ENTER = 0.45

const { dark } = useTheme()

const root = ref<HTMLElement | null>(null)

const layers = computed(() => plates(props.shot, dark.value))
const editing = computed(() => props.framing && !props.playing)

const ink = computed(() => (dark.value ? 'text-white/40' : 'text-black/45'))
const effectInk = computed(() => (dark.value ? 'text-white' : 'text-black'))
const effectShadow = computed(() =>
  dark.value ? '0 2px 10px rgba(0,0,0,0.65)' : '0 2px 8px rgba(255,255,255,0.75)',
)

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

const bubbles = computed(() => props.shot.bubbles.filter(showing))
const caption = computed(() =>
  props.captions ? props.shot.dialogue.find(showing)?.line : undefined,
)
const effects = computed(() => props.shot.effects.filter(showing))
const names = computed(() => new Map(props.assets.map((item) => [item.id, item])))

const shapes = {
  speech: 'rounded-[14px]',
  thought: 'rounded-full',
  shout: 'rounded-[4px] -skew-x-6 font-semibold',
  caption: 'rounded-[4px]',
}

const styles = {
  impact: 'text-[3.4cqmin] font-black tracking-tight -rotate-6',
  soft: 'text-[2.4cqmin] font-medium opacity-80',
  speed: 'text-[2.8cqmin] font-bold italic tracking-[0.08em] opacity-90',
  glow: 'text-[3cqmin] font-bold',
}

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

function drag(event: PointerEvent, item: { id: string; x: number; y: number }) {
  const el = root.value
  if (!el || props.playing || editing.value) return
  event.preventDefault()
  event.stopPropagation()
  emit('select', item.id)

  const rect = el.getBoundingClientRect()
  const startX = event.clientX
  const startY = event.clientY
  let last = { x: item.x, y: item.y }

  const move = (next: PointerEvent) => {
    const x = Math.round(
      Math.min(100, Math.max(0, item.x + ((next.clientX - startX) / rect.width) * 100)),
    )
    const y = Math.round(
      Math.min(100, Math.max(0, item.y + ((next.clientY - startY) / rect.height) * 100)),
    )
    if (x === last.x && y === last.y) return
    last = { x, y }
    emit('shift', item.id, x, y)
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
      </div>

      <div :class="cn('absolute inset-0', editing && 'pointer-events-none opacity-40')">
        <div
          v-for="effect in effects"
          :key="effect.id"
          :class="
            cn(
              'absolute -translate-x-1/2 -translate-y-1/2 cursor-move rounded select-none',
              styles[effect.style],
              effectInk,
              selected === effect.id && 'ring-selection ring-2 ring-offset-2 ring-offset-transparent',
            )
          "
          :style="{ left: `${effect.x}%`, top: `${effect.y}%`, textShadow: effectShadow }"
          @pointerdown="drag($event, effect)"
          @click.stop
        >
          {{ effect.text }}
        </div>

        <div
          v-for="bubble in bubbles"
          :key="bubble.id"
          :class="
            cn(
              'absolute max-w-[46cqmin] -translate-x-1/2 -translate-y-1/2 cursor-move bg-white px-[1.4cqmin] py-[0.8cqmin] text-[1.5cqmin] leading-snug text-black shadow-lg select-none',
              shapes[bubble.shape],
              selected === bubble.id && 'ring-selection ring-2',
            )
          "
          :style="{ left: `${bubble.x}%`, top: `${bubble.y}%` }"
          @pointerdown="drag($event, bubble)"
          @click.stop
        >
          <span
            v-if="names.get(bubble.assetId) && bubble.shape !== 'caption'"
            class="mr-1 text-[1.1cqmin] font-medium"
            :style="{ color: names.get(bubble.assetId)?.color }"
          >
            {{ names.get(bubble.assetId)?.name }}
          </span>
          {{ bubble.text }}
        </div>
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
