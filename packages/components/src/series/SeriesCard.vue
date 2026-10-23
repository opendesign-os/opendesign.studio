<script setup lang="ts">
import type { Episode, Series } from '@opendesign/models'
import { formats, seriesStatusLabel } from '@opendesign/models'
import { Badge, Progress } from '@opendesign/shadcn'
import { computed } from 'vue'

const props = defineProps<{ series: Series; episodes: Episode[] }>()
const emit = defineEmits<{ open: [id: string] }>()

const tones = {
  writing: 'neutral',
  producing: 'accent',
  review: 'warn',
  published: 'success',
} as const

const progress = computed(() => {
  const shots = props.episodes.reduce((total, item) => total + item.shots, 0)
  const done = props.episodes.reduce((total, item) => total + item.done, 0)
  return { shots, done }
})
</script>

<template>
  <button
    type="button"
    class="border-border bg-card hover:border-primary/40 group overflow-hidden rounded-xl border text-left transition-colors duration-150"
    @click="emit('open', series.id)"
  >
    <div
      class="relative flex h-28 items-end p-3"
      :style="{
        backgroundImage: `linear-gradient(140deg, ${series.color}44, transparent 70%), linear-gradient(20deg, ${series.color}22, transparent 60%)`,
      }"
    >
      <Badge :variant="tones[series.status]">
        <span class="size-1.5 rounded-full bg-current" />
        {{ seriesStatusLabel[series.status] }}
      </Badge>
      <Badge class="ml-auto">{{ formats[series.aspect].label }} {{ series.aspect }}</Badge>
    </div>

    <div class="p-3">
      <h3 class="truncate text-[15px] font-semibold tracking-tight">{{ series.title }}</h3>
      <p class="text-muted-foreground mt-1 line-clamp-2 text-data leading-relaxed">
        {{ series.synopsis }}
      </p>

      <div class="mt-3 flex flex-wrap gap-1">
        <Badge v-for="tag in series.tags" :key="tag">{{ tag }}</Badge>
      </div>

      <div class="text-muted-foreground mt-3 flex items-center justify-between text-meta">
        <span>{{ episodes.length }} 集 · {{ progress.done }}/{{ progress.shots }} 镜</span>
        <span>{{ series.updated }}</span>
      </div>
      <Progress class="mt-1.5 h-1" :model-value="progress.shots ? (progress.done / progress.shots) * 100 : 0" />
    </div>
  </button>
</template>
