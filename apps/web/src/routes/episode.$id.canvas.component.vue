<script setup lang="ts">
import { LayoutGrid, Search } from '@lucide/vue'
import { Avatar, Thumbnail, Tip } from '@opendesign/components'
import Canvas from '@opendesign/components/episode/Canvas.vue'
import { arrange, assetKindLabel } from '@opendesign/models'
import { useAssets, usePatchShot, useShots } from '@opendesign/queries'
import {
  Button,
  Card,
  cn,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@opendesign/shadcn'
import { useRouter, useSearch } from '@tanstack/vue-router'
import { computed, nextTick, ref } from 'vue'
import { useWorkspace } from '../composables/workspace'

const search = useSearch({ from: '/episode/$id/canvas' })
const router = useRouter()

const { episodeId, seriesId } = useWorkspace()
const { data: shots } = useShots(episodeId)
const { data: assets } = useAssets(seriesId)
const patch = usePatchShot()

const side = ref('shots')
const needle = ref('')
const spotlight = ref<string | null>(null)
const board = ref<{ focus: (id: string) => void; fit: () => void } | null>(null)

const rows = computed(() => shots.value ?? [])
const library = computed(() => assets.value ?? [])
const picked = computed(() => search.value.shot ?? null)

const listed = computed(() => {
  const word = needle.value.trim()
  return {
    shots: rows.value.filter(
      (shot) => !word || shot.scene.includes(word) || shot.prompt.includes(word),
    ),
    assets: library.value.filter((item) => !word || item.name.includes(word)),
  }
})

function select(id: string | null) {
  void router.navigate({
    to: '/episode/$id/canvas',
    params: { id: episodeId.value },
    search: { shot: id ?? undefined },
    replace: true,
  })
}

function open(id: string) {
  void router.navigate({
    to: '/episode/$id/edit',
    params: { id: episodeId.value },
    search: { shot: id },
  })
}

function reveal(id: string) {
  select(id)
  board.value?.focus(id)
}

function place(id: string, x: number, y: number) {
  patch.mutate({ id, patch: { position: { x, y } } })
}

async function tidy() {
  const spots = arrange(rows.value)
  for (const shot of rows.value) {
    const spot = spots.get(shot.id)
    if (spot && (spot.x !== shot.position.x || spot.y !== shot.position.y)) {
      place(shot.id, spot.x, spot.y)
    }
  }
  await nextTick()
  board.value?.fit()
}
</script>

<template>
  <div class="grid h-full min-h-0 grid-cols-[15rem_1fr] gap-3 px-6 pt-4 pb-6">
    <Card class="min-h-0 gap-0 overflow-hidden py-0 shadow-xs">
      <Tabs v-model="side" class="min-h-0 flex-1 gap-0">
        <div class="space-y-2 p-2">
          <TabsList class="w-full">
            <TabsTrigger value="shots">
              镜头
              <span class="font-mono tabular-nums opacity-60">{{ rows.length }}</span>
            </TabsTrigger>
            <TabsTrigger value="assets">
              资产
              <span class="font-mono tabular-nums opacity-60">{{ library.length }}</span>
            </TabsTrigger>
          </TabsList>
          <div class="relative">
            <Search
              class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
            />
            <Input v-model="needle" type="search" placeholder="搜索" class="pl-8" />
          </div>
        </div>

        <TabsContent value="shots" class="min-h-0 overflow-y-auto px-2 pb-2">
          <button
            v-for="shot in listed.shots"
            :key="shot.id"
            type="button"
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors duration-150',
                shot.id === picked ? 'bg-selection/10' : 'hover:bg-accent',
              )
            "
            @click="reveal(shot.id)"
            @dblclick="open(shot.id)"
          >
            <Thumbnail :shot="shot" class="size-9 shrink-0 rounded-md" />
            <span class="min-w-0 flex-1">
              <span class="text-data block font-medium">镜 {{ shot.index }}</span>
              <span class="text-muted-foreground text-meta block truncate">{{ shot.scene }}</span>
            </span>
          </button>
        </TabsContent>

        <TabsContent value="assets" class="min-h-0 overflow-y-auto px-2 pb-2">
          <button
            v-for="item in listed.assets"
            :key="item.id"
            type="button"
            :class="
              cn(
                'flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors duration-150',
                item.id === spotlight ? 'bg-selection/10' : 'hover:bg-accent',
              )
            "
            @click="spotlight = spotlight === item.id ? null : item.id"
          >
            <Avatar :name="item.name" :color="item.color" class="text-body size-9 rounded-md" />
            <span class="min-w-0 flex-1">
              <span class="text-data block truncate font-medium">{{ item.name }}</span>
              <span class="text-muted-foreground text-meta block">
                {{ assetKindLabel[item.kind] }} ·
                {{ rows.filter((shot) => shot.cast.includes(item.id)).length }} 镜
              </span>
            </span>
          </button>
        </TabsContent>
      </Tabs>
    </Card>

    <div class="relative min-h-0">
      <Canvas
        ref="board"
        class="border-border bg-muted/40 h-full rounded-xl border"
        :shots="rows"
        :assets="library"
        :selected="picked"
        :spotlight="spotlight"
        @select="select"
        @open="open"
        @move="place"
      />
      <p class="text-muted-foreground text-meta pointer-events-none absolute top-3 left-3">
        拖动节点排布分镜，双击进入剪辑
      </p>
      <Tip label="按场次排列">
        <Button variant="outline" size="icon-sm" class="absolute top-2 right-2" @click="tidy">
          <LayoutGrid />
        </Button>
      </Tip>
    </div>
  </div>
</template>
