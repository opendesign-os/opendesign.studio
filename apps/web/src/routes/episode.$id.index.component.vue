<script setup lang="ts">
import { LayoutGrid, List, Search } from '@lucide/vue'
import { Board, fills, ShotTable, Tip, tones } from '@opendesign/components'
import { ready, shotStatus, shotStatusLabel } from '@opendesign/models'
import { useAssets, useShots } from '@opendesign/queries'
import { cn, Input, Skeleton, ToggleGroup, ToggleGroupItem } from '@opendesign/shadcn'
import { useRouter } from '@tanstack/vue-router'
import { useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useWorkspace } from '../composables/workspace'

const chip =
  'text-muted-foreground hover:text-foreground data-[state=on]:bg-accent data-[state=on]:text-foreground h-7 shrink-0 gap-1.5 rounded-md px-2.5 text-meta font-medium shadow-none'
const mode =
  'text-muted-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-xs size-7 min-w-0 rounded-md px-0 hover:bg-transparent'

const router = useRouter()

const { episodeId, seriesId } = useWorkspace()
const { data: shots, isPending } = useShots(episodeId)
const { data: assets } = useAssets(seriesId)

const query = ref('')
const status = ref('all')
const view = useLocalStorage('board-view', 'grid')

const rows = computed(() => [...(shots.value ?? [])].sort((a, b) => a.index - b.index))
const library = computed(() => assets.value ?? [])

const filters = computed(() => {
  const counts = new Map<string, number>()
  for (const shot of rows.value) counts.set(shot.status, (counts.get(shot.status) ?? 0) + 1)
  return [
    { id: 'all', label: '全部', count: rows.value.length, dot: '' },
    ...shotStatus.options
      .map((item) => ({
        id: item,
        label: shotStatusLabel[item],
        count: counts.get(item) ?? 0,
        dot: fills[tones.shot[item]],
      }))
      .filter((item) => item.count || item.id === status.value),
  ]
})

const visible = computed(() => {
  const word = query.value.trim().toLowerCase()
  return rows.value.filter((shot) => {
    if (status.value !== 'all' && shot.status !== status.value) return false
    if (!word) return true
    return [
      `镜 ${shot.index}`,
      shot.scene,
      shot.prompt,
      shot.note,
      ...shot.dialogue.map((item) => item.line),
    ].some((text) => text.toLowerCase().includes(word))
  })
})

const summary = computed(() => ({
  seconds: rows.value.reduce((total, shot) => total + shot.duration, 0),
  ready: rows.value.filter((shot) => ready(shot, library.value)).length,
}))

function filter(value: unknown) {
  status.value = typeof value === 'string' && value ? value : 'all'
}

function switchView(value: unknown) {
  if (value === 'grid' || value === 'list') view.value = value
}

function open(id: string) {
  void router.navigate({
    to: '/episode/$id/edit',
    params: { id: episodeId.value },
    search: { shot: id },
  })
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="border-border flex h-12 shrink-0 items-center gap-3 border-b px-6">
      <ToggleGroup
        type="single"
        class="min-w-0 gap-0.5 overflow-x-auto"
        :model-value="status"
        @update:model-value="filter"
      >
        <ToggleGroupItem v-for="item in filters" :key="item.id" :value="item.id" :class="chip">
          <span v-if="item.dot" :class="cn('size-1.5 rounded-full', item.dot)" />
          {{ item.label }}
          <span class="font-mono tabular-nums opacity-60">{{ item.count }}</span>
        </ToggleGroupItem>
      </ToggleGroup>

      <div class="ml-auto flex shrink-0 items-center gap-2">
        <span class="text-muted-foreground hidden text-meta tabular-nums xl:inline">
          {{ rows.length }} 镜 · {{ summary.seconds.toFixed(1) }}s · {{ summary.ready }} 个可生成
        </span>
        <div class="relative">
          <Search
            class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
          />
          <Input
            v-model="query"
            type="search"
            placeholder="搜索画面、台词、场次"
            class="bg-muted/60 focus-visible:bg-background h-8 w-52 border-transparent pl-8 shadow-none"
          />
        </div>
        <ToggleGroup
          type="single"
          class="bg-muted/70 gap-0.5 rounded-lg p-0.5"
          :model-value="view"
          @update:model-value="switchView"
        >
          <Tip label="卡片">
            <ToggleGroupItem value="grid" :class="mode">
              <LayoutGrid />
            </ToggleGroupItem>
          </Tip>
          <Tip label="表格">
            <ToggleGroupItem value="list" :class="mode">
              <List />
            </ToggleGroupItem>
          </Tip>
        </ToggleGroup>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-auto px-6 py-5">
      <div v-if="isPending" class="grid grid-cols-[repeat(auto-fill,minmax(min(15rem,100%),1fr))] gap-3">
        <Skeleton v-for="index in 8" :key="index" class="h-64 rounded-xl" />
      </div>
      <Board v-else-if="view === 'grid'" :shots="visible" :assets="library" @open="open" />
      <ShotTable v-else :shots="visible" :assets="library" @open="open" />
    </div>
  </div>
</template>
