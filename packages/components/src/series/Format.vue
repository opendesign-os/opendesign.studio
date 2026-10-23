<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import type { Aspect } from '@opendesign/models'
import { aspect, formats } from '@opendesign/models'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@opendesign/shadcn'
import { unrefElement } from '@vueuse/core'
import { computed, ref } from 'vue'
import Tip from '../layout/Tip.vue'

const value = defineModel<Aspect>({ required: true })

const trigger = ref()
const reference = computed(() => unrefElement(trigger) ?? undefined)

function shape(key: Aspect, size: number) {
  const { width, height } = formats[key]
  const scale = size / Math.max(width, height)
  return { width: `${Math.round(width * scale)}px`, height: `${Math.round(height * scale)}px` }
}

function choose(next: unknown) {
  const parsed = aspect.safeParse(next)
  if (parsed.success) value.value = parsed.data
}
</script>

<template>
  <DropdownMenu>
    <Tip :label="`画幅 ${formats[value].width}×${formats[value].height}`">
      <DropdownMenuTrigger as-child>
        <Button ref="trigger" variant="ghost" size="xs">
          <span class="shrink-0 rounded-[2px] border-[1.5px] border-current" :style="shape(value, 12)" />
          <span class="hidden @3xs:inline">{{ formats[value].label }}</span>
          <span class="text-muted-foreground font-mono tabular-nums">{{ value }}</span>
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
    </Tip>
    <DropdownMenuContent :reference="reference" align="end" class="w-72">
      <DropdownMenuLabel class="text-muted-foreground text-meta font-normal">
        画幅 · 整部剧的分集共用
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup :model-value="value" @update:model-value="choose">
        <DropdownMenuRadioItem
          v-for="key in aspect.options"
          :key="key"
          :value="key"
          class="text-data gap-3"
        >
          <span class="flex size-5 shrink-0 items-center justify-center">
            <span class="rounded-[2px] border-[1.5px] border-current" :style="shape(key, 18)" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-baseline gap-1.5">
              {{ formats[key].label }}
              <span class="text-muted-foreground text-meta font-mono tabular-nums">{{ key }}</span>
            </span>
            <span class="text-muted-foreground block truncate text-micro">{{ formats[key].hint }}</span>
          </span>
          <span class="text-muted-foreground shrink-0 font-mono text-micro tabular-nums">
            {{ formats[key].width }}×{{ formats[key].height }}
          </span>
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
