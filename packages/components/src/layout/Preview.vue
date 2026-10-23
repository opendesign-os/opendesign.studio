<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@opendesign/shadcn'
import { unrefElement, useElementSize } from '@vueuse/core'
import { computed, ref } from 'vue'
import Tip from './Tip.vue'

const props = defineProps<{ width: number; height: number }>()

const zoom = defineModel<'fit' | number>('zoom', { default: 'fit' })

const LEVELS = [25, 50, 75, 100]

const viewport = ref<HTMLElement | null>(null)
const trigger = ref()
const reference = computed(() => unrefElement(trigger) ?? undefined)
const bounds = useElementSize(viewport)

const scale = computed(() => {
  if (zoom.value !== 'fit') return zoom.value / 100
  return Math.max(0, Math.min(bounds.width.value / props.width, bounds.height.value / props.height))
})

const label = computed(() => (zoom.value === 'fit' ? '适应' : `${zoom.value}%`))

function choose(value: unknown) {
  if (value === 'fit' || typeof value === 'number') zoom.value = value
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="flex h-11 shrink-0 items-center gap-1 px-3">
      <slot name="tools" />
      <div class="ml-auto flex shrink-0 items-center gap-1">
        <slot name="actions" />
        <DropdownMenu>
          <Tip label="画面缩放">
            <DropdownMenuTrigger as-child>
              <Button ref="trigger" variant="ghost" size="xs" class="font-mono tabular-nums">
                {{ label }}
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
          </Tip>
          <DropdownMenuContent :reference="reference" align="end" class="min-w-32">
            <DropdownMenuRadioGroup :model-value="zoom" @update:model-value="choose">
              <DropdownMenuRadioItem value="fit">适应窗口</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              <DropdownMenuRadioItem
                v-for="level in LEVELS"
                :key="level"
                :value="level"
                class="font-mono tabular-nums"
              >
                {{ level }}%
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <div class="relative min-h-0 flex-1">
      <div
        ref="viewport"
        :class="
          cn('absolute inset-0 flex p-5', zoom === 'fit' ? 'overflow-hidden' : 'overflow-auto')
        "
      >
        <div
          class="ring-border bg-stage relative m-auto shrink-0 rounded-xl shadow-lg ring-1"
          :style="{ width: `${width * scale}px`, height: `${height * scale}px` }"
        >
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
