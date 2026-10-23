<script setup lang="ts">
import type { Camera, Move } from '@opendesign/models'
import { camera, cameraLabel, moves } from '@opendesign/models'
import { cn } from '@opendesign/shadcn'
import { crop } from '../shot/artwork'

defineProps<{ move: Move }>()
const emit = defineEmits<{ apply: [kind: Camera] }>()
</script>

<template>
  <div class="space-y-3 p-3">
    <p class="text-muted-foreground text-meta leading-relaxed">
      套用到当前镜头，实线是起幅、虚线是落幅，细调在右侧「运镜」
    </p>
    <ul class="grid grid-cols-[repeat(auto-fill,minmax(min(7rem,100%),1fr))] gap-2">
      <li v-for="kind in camera.options" :key="kind">
        <button type="button" class="group w-full text-left" @click="emit('apply', kind)">
          <span
            :class="
              cn(
                'bg-muted relative block aspect-[4/3] rounded-lg ring-offset-2 ring-offset-card transition-shadow duration-150',
                kind === move.kind ? 'ring-selection ring-2' : 'group-hover:ring-border group-hover:ring-2',
              )
            "
          >
            <span class="bg-card absolute inset-[16%] rounded-[4px]">
              <span class="border-primary absolute rounded-[3px] border-2" :style="crop(moves[kind].from)" />
              <span
                class="border-media absolute rounded-[3px] border-2 border-dashed"
                :style="crop(moves[kind].to)"
              />
            </span>
          </span>
          <span class="mt-1 block text-[11.5px]">{{ cameraLabel[kind] }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
