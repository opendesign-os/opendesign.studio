<script setup lang="ts">
import { Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from '@lucide/vue'
import { timecode } from '@opendesign/common'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Slider,
} from '@opendesign/shadcn'
import { unrefElement } from '@vueuse/core'
import { computed, ref } from 'vue'
import Tip from '../layout/Tip.vue'

defineProps<{ time: number; duration: number }>()

const emit = defineEmits<{ skip: [direction: -1 | 1] }>()

const playing = defineModel<boolean>('playing', { required: true })
const rate = defineModel<number>('rate', { default: 1 })
const volume = defineModel<number>('volume', { default: 1 })

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2]

const trigger = ref()
const reference = computed(() => unrefElement(trigger) ?? undefined)

let level = 1

const speaker = computed(() => {
  if (volume.value === 0) return VolumeX
  return volume.value < 0.5 ? Volume1 : Volume2
})

function mute() {
  if (volume.value > 0) {
    level = volume.value
    volume.value = 0
  } else {
    volume.value = level
  }
}

function pace(value: unknown) {
  if (typeof value === 'number') rate.value = value
}

function gain(value: number[] | undefined) {
  const next = value?.[0]
  if (next !== undefined) volume.value = next
}
</script>

<template>
  <div
    class="flex shrink-0 items-center gap-3 px-4 pt-1 pb-3 @md:grid @md:grid-cols-[1fr_auto_1fr]"
  >
    <p class="text-data min-w-0 flex-1 truncate font-mono tabular-nums">
      {{ timecode(time) }}
      <span class="text-muted-foreground hidden @md:inline">/ {{ timecode(duration) }}</span>
    </p>

    <div class="flex shrink-0 items-center gap-1.5">
      <Tip label="上一镜" shortcut="↑">
        <Button variant="ghost" size="icon-sm" @click="emit('skip', -1)">
          <SkipBack />
        </Button>
      </Tip>
      <Tip :label="playing ? '暂停' : '播放'" shortcut="空格">
        <Button size="icon" class="rounded-full" @click="playing = !playing">
          <Pause v-if="playing" />
          <Play v-else class="translate-x-px" />
        </Button>
      </Tip>
      <Tip label="下一镜" shortcut="↓">
        <Button variant="ghost" size="icon-sm" @click="emit('skip', 1)">
          <SkipForward />
        </Button>
      </Tip>
    </div>

    <div class="flex shrink-0 items-center justify-end gap-1">
      <DropdownMenu>
        <Tip label="播放速度">
          <DropdownMenuTrigger as-child>
            <Button
              ref="trigger"
              variant="ghost"
              size="sm"
              class="hidden min-w-12 font-mono tabular-nums @xs:inline-flex"
            >
              {{ rate }}×
            </Button>
          </DropdownMenuTrigger>
        </Tip>
        <DropdownMenuContent :reference="reference" align="end" class="min-w-28">
          <DropdownMenuLabel>播放速度</DropdownMenuLabel>
          <DropdownMenuRadioGroup :model-value="rate" @update:model-value="pace">
            <DropdownMenuRadioItem
              v-for="value in RATES"
              :key="value"
              :value="value"
              class="font-mono tabular-nums"
            >
              {{ value }}×
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Tip :label="volume ? '静音' : '取消静音'">
        <Button variant="ghost" size="icon-sm" class="hidden @3xs:inline-flex" @click="mute">
          <component :is="speaker" />
        </Button>
      </Tip>
      <Slider
        class="hidden w-20 @lg:flex"
        :model-value="[volume]"
        :min="0"
        :max="1"
        :step="0.05"
        aria-label="音量"
        @update:model-value="gain"
      />
      <slot />
    </div>
  </div>
</template>
