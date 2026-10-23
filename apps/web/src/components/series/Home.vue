<script setup lang="ts">
import { CircleAlert, Eye, Film, Lock, Plus, Zap } from '@lucide/vue'
import { SeriesCard } from '@opendesign/components'
import { useEpisodes, useOverview, useSeriesList } from '@opendesign/queries'
import { Button, Skeleton } from '@opendesign/shadcn'
import { computed, ref } from 'vue'
import CreateSeries from './CreateSeries.vue'

const emit = defineEmits<{ enter: [seriesId: string] }>()

const { data: series, isPending } = useSeriesList()
const { data: episodes } = useEpisodes()
const { data: overview } = useOverview()
const creating = ref(false)

const metrics = computed(() => [
  { label: '在制剧集', icon: Film, value: overview.value?.producing ?? 0 },
  { label: '生成中', icon: Zap, value: overview.value?.running ?? 0 },
  { label: '卡住的镜头', icon: CircleAlert, value: overview.value?.blocked ?? 0 },
  { label: '待审镜头', icon: Eye, value: overview.value?.review ?? 0 },
  { label: '未锁参考图', icon: Lock, value: overview.value?.loose ?? 0 },
])

const grouped = computed(() => {
  const all = episodes.value ?? []
  return (series.value ?? []).map((item) => ({
    series: item,
    episodes: all.filter((episode) => episode.seriesId === item.id),
  }))
})
</script>

<template>
  <header class="border-border flex h-12 shrink-0 items-center gap-2 border-b px-5 pr-12">
    <h2 class="text-body font-semibold">作品台</h2>
    <span class="text-muted-foreground text-meta">
      {{ overview?.series ?? 0 }} 部作品 · {{ overview?.shots ?? 0 }} 个镜头 ·
      {{ overview?.assets ?? 0 }} 个资产
    </span>
    <Button size="sm" class="ml-auto" @click="creating = true">
      <Plus />
      新建作品
    </Button>
  </header>
  <CreateSeries v-model="creating" @created="emit('enter', $event.id)" />

  <div class="min-h-0 flex-1 overflow-y-auto p-5">
    <dl class="border-border divide-border grid grid-cols-5 divide-x rounded-lg border">
      <div v-for="item in metrics" :key="item.label" class="px-4 py-3">
        <dt class="text-muted-foreground flex items-center gap-1.5 text-meta">
          <component :is="item.icon" class="size-3.5" />
          {{ item.label }}
        </dt>
        <dd class="mt-1 text-xl font-semibold tracking-tight tabular-nums">{{ item.value }}</dd>
      </div>
    </dl>

    <div v-if="isPending" class="mt-5 grid grid-cols-3 gap-3">
      <Skeleton v-for="index in 3" :key="index" class="h-56 rounded-xl" />
    </div>
    <div v-else class="mt-5 grid grid-cols-3 gap-3">
      <SeriesCard
        v-for="group in grouped"
        :key="group.series.id"
        :series="group.series"
        :episodes="group.episodes"
        @open="emit('enter', $event)"
      />
    </div>
  </div>
</template>
