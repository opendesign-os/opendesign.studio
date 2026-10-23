<script setup lang="ts">
import { CheckCheck, PanelRight } from '@lucide/vue'
import { Candidates, Screenplay, Tip } from '@opendesign/components'
import {
  useAssets,
  useCandidates,
  useEpisode,
  useParseEpisode,
  usePatchEpisode,
  useResolveCandidate,
  useSeries,
} from '@opendesign/queries'
import { Button, cn } from '@opendesign/shadcn'
import { useParams } from '@tanstack/vue-router'
import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

const params = useParams({ from: '/episode/$id/script' })

const episodeId = computed(() => params.value.id)
const { data: episode } = useEpisode(episodeId)
const seriesId = computed(() => episode.value?.seriesId ?? '')
const { data: series } = useSeries(seriesId)
const { data: assets } = useAssets(seriesId)
const { data: candidates } = useCandidates(episodeId)
const patchEpisode = usePatchEpisode()
const parse = useParseEpisode()
const resolve = useResolveCandidate()

const drawer = useLocalStorage('script-candidates', true)

const pending = computed(() => candidates.value ?? [])
const speakers = computed(() =>
  (assets.value ?? [])
    .filter((item) => item.kind === 'character' && item.voice !== 'narrator')
    .map((item) => ({ name: item.name, color: item.color })),
)

function acceptAll() {
  for (const item of pending.value) resolve.mutate({ id: item.id, accept: true })
}
</script>

<template>
  <div class="flex h-full min-h-0">
    <div class="min-w-0 flex-1">
      <Screenplay
        :script="episode?.script ?? ''"
        :parsing="parse.isPending.value || episode?.status === 'parsing'"
        :speakers="speakers"
        :outline="series?.outline ?? ''"
        @save="patchEpisode.mutate({ id: episodeId, patch: { script: $event } })"
        @parse="parse.mutate(episodeId)"
      >
        <template #actions>
          <Tip :label="drawer ? '收起候选资产' : `候选资产 · ${pending.length}`">
            <Button
              variant="ghost"
              size="icon-sm"
              :class="cn('relative', drawer ? 'text-foreground' : 'text-muted-foreground')"
              @click="drawer = !drawer"
            >
              <PanelRight />
              <span
                v-if="!drawer && pending.length"
                class="bg-primary ring-background absolute top-1.5 right-1.5 size-1.5 rounded-full ring-2"
              />
            </Button>
          </Tip>
        </template>
      </Screenplay>
    </div>

    <aside v-if="drawer" class="border-border bg-card flex w-80 shrink-0 flex-col border-l">
      <header class="border-border flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <h2 class="text-data font-semibold">候选资产</h2>
        <span class="text-muted-foreground font-mono text-meta tabular-nums">{{ pending.length }}</span>
        <Tip label="全部收进资产库">
          <Button
            variant="ghost"
            size="icon-sm"
            class="text-muted-foreground ml-auto"
            :disabled="!pending.length || resolve.isPending.value"
            @click="acceptAll"
          >
            <CheckCheck />
          </Button>
        </Tip>
      </header>
      <div class="min-h-0 flex-1 overflow-y-auto">
        <Candidates
          :items="pending"
          :busy="resolve.isPending.value"
          @resolve="(id, accept) => resolve.mutate({ id, accept })"
        />
      </div>
    </aside>
  </div>
</template>
