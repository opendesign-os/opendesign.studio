<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { clock } from '@opendesign/common'
import type { Episode, EpisodeStatus } from '@opendesign/models'
import { episodeStatusLabel } from '@opendesign/models'
import { Badge, cn, Progress } from '@opendesign/shadcn'
import type { Tone } from '../types'

defineProps<{ episode: Episode; active?: boolean }>()
const emit = defineEmits<{ open: [id: string] }>()

const tones: Record<EpisodeStatus, Tone> = {
  draft: 'neutral',
  parsing: 'info',
  producing: 'accent',
  review: 'warn',
  done: 'success',
}
</script>

<template>
  <button
    type="button"
    :class="
      cn(
        'border-border group flex w-full items-center gap-4 border-b px-4 py-3 text-left transition-colors duration-150 last:border-b-0',
        active ? 'bg-selection/10' : 'hover:bg-accent',
      )
    "
    @click="emit('open', episode.id)"
  >
    <span class="text-muted-foreground w-10 shrink-0 text-center font-mono text-body tabular-nums">
      {{ String(episode.index).padStart(2, '0') }}
    </span>

    <span class="min-w-0 flex-1">
      <span class="block truncate text-body font-medium">{{ episode.title }}</span>
      <span class="text-muted-foreground mt-1 block truncate text-meta">
        {{ episode.hook || `${episode.shots} 镜 · ${clock(episode.duration)}` }}
      </span>
    </span>

    <span class="w-32 shrink-0">
      <span class="text-muted-foreground mb-1 block text-right font-mono text-meta tabular-nums">
        {{ episode.done }}/{{ episode.shots }}
      </span>
      <Progress class="h-1" :model-value="episode.shots ? (episode.done / episode.shots) * 100 : 0" />
    </span>

    <Badge :variant="tones[episode.status]">
      <span class="size-1.5 rounded-full bg-current" />
      {{ episodeStatusLabel[episode.status] }}
    </Badge>

    <ChevronRight class="text-muted-foreground size-4 shrink-0" />
  </button>
</template>
