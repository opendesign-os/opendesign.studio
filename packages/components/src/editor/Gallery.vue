<script setup lang="ts">
import type { Placement } from '@opendesign/models'
import { cn } from '@opendesign/shadcn'
import Thumbnail from '../shot/Thumbnail.vue'
import { fills, statusTone } from '../tone'

defineProps<{ placements: Placement[]; current: string }>()
const emit = defineEmits<{ pick: [id: string] }>()
</script>

<template>
  <ul class="grid grid-cols-[repeat(auto-fill,minmax(min(6.5rem,100%),1fr))] gap-2 px-3 pt-1.5 pb-3">
    <li v-for="item in placements" :key="item.shot.id">
      <button
        type="button"
        :title="item.shot.scene"
        class="group block w-full"
        @click="emit('pick', item.shot.id)"
      >
        <Thumbnail
          :shot="item.shot"
          :class="
            cn(
              'aspect-[4/3] rounded-lg ring-offset-2 ring-offset-card transition-shadow duration-150',
              item.shot.id === current ? 'ring-primary ring-2' : 'group-hover:ring-border group-hover:ring-2',
            )
          "
        >
          <span
            class="text-micro absolute top-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/45 px-1.5 py-0.5 leading-3.5 font-semibold text-white backdrop-blur-sm"
          >
            <span :class="cn('size-1.5 rounded-full', fills[statusTone[item.shot.status]])" />
            镜 {{ item.shot.index }}
          </span>
          <span
            class="text-micro absolute right-1.5 bottom-1.5 rounded-md bg-black/45 px-1 font-mono leading-3.5 text-white tabular-nums backdrop-blur-sm"
          >
            {{ item.shot.duration.toFixed(1) }}s
          </span>
        </Thumbnail>
      </button>
    </li>
  </ul>
</template>
