<script setup lang="ts">
import { Boxes, Check, LayoutGrid } from '@lucide/vue'
import { Format, fills, type Tone } from '@opendesign/components'
import type { Aspect, SeriesStatus } from '@opendesign/models'
import { locked, seriesStatusLabel } from '@opendesign/models'
import {
  useAssets,
  useEpisode,
  useEpisodes,
  usePatchSeries,
  useSeries,
  useSeriesList,
} from '@opendesign/queries'
import { cn, Separator } from '@opendesign/shadcn'
import { useParams } from '@tanstack/vue-router'
import { computed } from 'vue'

const emit = defineEmits<{ enter: [seriesId: string]; show: [name: string] }>()

const row =
  'hover:bg-accent text-data flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150 [&_svg]:size-4 [&_svg]:shrink-0'

const tones: Record<SeriesStatus, Tone> = {
  writing: 'neutral',
  producing: 'accent',
  review: 'warn',
  published: 'success',
}

const params = useParams({ from: '/episode/$id' })
const episodeId = computed(() => params.value.id)
const { data: episode } = useEpisode(episodeId)
const seriesId = computed(() => episode.value?.seriesId ?? '')
const { data: series } = useSeries(seriesId)
const { data: list } = useSeriesList()
const { data: episodes } = useEpisodes(seriesId)
const { data: assets } = useAssets(seriesId)
const patchSeries = usePatchSeries()

const loose = computed(() => (assets.value ?? []).filter((item) => !locked(item)).length)
const minutes = computed(() =>
  Math.round((episodes.value ?? []).reduce((total, item) => total + item.duration, 0) / 60),
)

function setAspect(aspect: Aspect) {
  patchSeries.mutate({ id: seriesId.value, patch: { aspect } })
}
</script>

<template>
  <div v-if="series" class="@container">
    <div class="space-y-2.5 p-3">
      <div class="flex items-center gap-2.5">
        <span
          class="text-body flex size-9 shrink-0 items-center justify-center rounded-lg font-semibold text-white"
          :style="{ backgroundColor: series.color }"
        >
          {{ series.title.slice(0, 1) }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-body truncate font-semibold">{{ series.title }}</p>
          <p class="text-muted-foreground flex items-center gap-1.5 text-meta">
            <span :class="cn('size-1.5 rounded-full', fills[tones[series.status]])" />
            {{ seriesStatusLabel[series.status] }} · {{ episodes?.length ?? 0 }} 集 · {{ minutes }} 分钟
          </p>
        </div>
      </div>
      <p class="text-muted-foreground line-clamp-3 text-meta leading-relaxed">{{ series.synopsis }}</p>
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground text-meta">画幅</span>
        <Format :model-value="series.aspect" @update:model-value="setAspect" />
      </div>
    </div>

    <Separator />

    <div class="p-1">
      <p class="text-muted-foreground px-2 py-1.5 text-micro">切换作品</p>
      <button v-for="item in list" :key="item.id" type="button" :class="row" @click="emit('enter', item.id)">
        <span
          class="flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-semibold text-white"
          :style="{ backgroundColor: item.color }"
        >
          {{ item.title.slice(0, 1) }}
        </span>
        <span class="min-w-0 flex-1 truncate">{{ item.title }}</span>
        <span class="text-muted-foreground font-mono text-micro">{{ item.aspect }}</span>
        <Check v-if="item.id === series.id" class="text-foreground" />
      </button>
    </div>

    <Separator />

    <div class="p-1">
      <button type="button" :class="row" @click="emit('show', 'assets')">
        <Boxes class="text-muted-foreground" />
        <span class="flex-1">资产库</span>
        <span v-if="loose" class="text-container text-micro">{{ loose }} 个未锁</span>
      </button>
      <button type="button" :class="row" @click="emit('show', 'home')">
        <LayoutGrid class="text-muted-foreground" />
        <span class="flex-1">作品台</span>
      </button>
    </div>
  </div>
</template>
