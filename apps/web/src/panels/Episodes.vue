<script setup lang="ts">
import { Check } from '@lucide/vue'
import { fills, type Tone } from '@opendesign/components'
import type { EpisodeStatus } from '@opendesign/models'
import { episodeStatusLabel } from '@opendesign/models'
import { useEpisode, useEpisodes } from '@opendesign/queries'
import { cn } from '@opendesign/shadcn'
import { useParams } from '@tanstack/vue-router'
import { computed } from 'vue'

const emit = defineEmits<{ open: [episodeId: string] }>()

const tones: Record<EpisodeStatus, Tone> = {
  draft: 'neutral',
  parsing: 'info',
  producing: 'accent',
  review: 'warn',
  done: 'success',
}

const params = useParams({ from: '/episode/$id' })
const episodeId = computed(() => params.value.id)
const { data: episode } = useEpisode(episodeId)
const { data: episodes } = useEpisodes(computed(() => episode.value?.seriesId ?? ''))

const rows = computed(() => [...(episodes.value ?? [])].sort((a, b) => a.index - b.index))
</script>

<template>
  <div class="p-1">
    <p class="text-muted-foreground px-2 py-1.5 text-micro">分集 · {{ rows.length }}</p>
    <button
      v-for="item in rows"
      :key="item.id"
      type="button"
      :class="
        cn(
          'hover:bg-accent text-data flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors duration-150',
          item.id === episodeId && 'bg-accent',
        )
      "
      @click="emit('open', item.id)"
    >
      <span class="text-muted-foreground w-5 shrink-0 font-mono text-micro tabular-nums">
        {{ String(item.index).padStart(2, '0') }}
      </span>
      <span class="min-w-0 flex-1 truncate">{{ item.title }}</span>
      <span class="text-muted-foreground font-mono text-micro tabular-nums">
        {{ item.done }}/{{ item.shots }}
      </span>
      <span
        :title="episodeStatusLabel[item.status]"
        :class="cn('size-1.5 shrink-0 rounded-full', fills[tones[item.status]])"
      />
      <Check :class="cn('size-3.5 shrink-0', item.id === episodeId ? 'opacity-100' : 'opacity-0')" />
    </button>
  </div>
</template>
