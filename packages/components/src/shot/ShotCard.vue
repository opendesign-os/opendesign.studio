<script setup lang="ts">
import { Clapperboard, MessageSquare, Mic } from '@lucide/vue'
import type { Asset, Shot } from '@opendesign/models'
import { cameraLabel, shotSizeLabel } from '@opendesign/models'
import { Badge, cn } from '@opendesign/shadcn'
import { computed } from 'vue'
import Tip from '../layout/Tip.vue'
import Status from './Status.vue'
import Thumbnail from './Thumbnail.vue'

const props = defineProps<{ shot: Shot; assets: Asset[]; selected: boolean; dim: boolean }>()
const emit = defineEmits<{ open: [] }>()

const cast = computed(() => props.assets.filter((item) => props.shot.cast.includes(item.id)))
</script>

<template>
  <article
    :class="
      cn(
        'bg-card overflow-hidden rounded-xl border shadow-sm transition-[box-shadow,opacity] duration-150',
        selected ? 'border-selection ring-selection/25 ring-4' : 'border-border hover:shadow-md',
        dim && 'opacity-35',
      )
    "
  >
    <Thumbnail :shot="shot" class="aspect-video">
      <span class="bg-card/90 absolute top-2 left-2 rounded-md shadow-xs">
        <Status :status="shot.status" />
      </span>
      <span
        class="absolute right-2 bottom-2 rounded-md bg-black/45 px-1.5 font-mono text-micro leading-4 text-white tabular-nums backdrop-blur-sm"
      >
        {{ shot.duration.toFixed(1) }}s
      </span>
    </Thumbnail>

    <header class="border-border flex h-9 items-center gap-2 border-b px-3">
      <span class="text-data font-semibold">镜 {{ shot.index }}</span>
      <span class="text-muted-foreground min-w-0 flex-1 truncate text-meta">{{ shot.scene }}</span>
      <Tip label="进入剪辑">
        <button
          type="button"
          class="text-muted-foreground hover:bg-accent hover:text-foreground flex size-6 shrink-0 items-center justify-center rounded-md transition-colors duration-150"
          @click="emit('open')"
        >
          <Clapperboard class="size-3.5" />
        </button>
      </Tip>
    </header>

    <div class="space-y-2 px-3 py-2.5">
      <p class="text-muted-foreground line-clamp-2 text-meta leading-relaxed">{{ shot.prompt }}</p>
      <div class="flex flex-wrap items-center gap-1">
        <Badge>{{ shotSizeLabel[shot.size] }}</Badge>
        <Badge>{{ cameraLabel[shot.move.kind] }}</Badge>
        <Badge v-if="shot.dialogue.length">
          <Mic class="size-3" />
          {{ shot.dialogue.length }}
        </Badge>
        <Badge v-if="shot.bubbles.length">
          <MessageSquare class="size-3" />
          {{ shot.bubbles.length }}
        </Badge>
        <span class="ml-auto flex -space-x-1.5">
          <span
            v-for="item in cast.slice(0, 4)"
            :key="item.id"
            :title="item.name"
            class="ring-card flex size-5 items-center justify-center rounded-full text-[9px] font-medium text-white ring-2"
            :style="{ backgroundColor: item.color }"
          >
            {{ item.name.slice(0, 1) }}
          </span>
        </span>
      </div>
    </div>
  </article>
</template>
