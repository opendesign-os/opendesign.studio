<script setup lang="ts">
import { AudioLines, Mic, Play, Plus } from '@lucide/vue'
import { clock } from '@opendesign/common'
import type { Asset, FoleyKind } from '@opendesign/models'
import { Button, cn } from '@opendesign/shadcn'
import { computed } from 'vue'
import Tip from '../layout/Tip.vue'

type Preset = { kind: FoleyKind; name: string; duration: number }
type Line = { id: string; index: number; assetId: string; line: string; start: number }

const props = defineProps<{
  presets: Preset[]
  lines: Line[]
  assets: Asset[]
  selected: string | null
}>()

const emit = defineEmits<{
  add: [kind: FoleyKind]
  preview: [kind: FoleyKind]
  listen: [id: string]
  select: [id: string]
}>()

const roster = computed(() => new Map(props.assets.map((item) => [item.id, item])))
</script>

<template>
  <div class="space-y-4 p-3">
    <section v-if="presets.length">
      <h3 class="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-meta font-medium">
        音效库
        <span class="font-mono tabular-nums opacity-70">{{ presets.length }}</span>
      </h3>
      <ul class="space-y-0.5">
        <li
          v-for="preset in presets"
          :key="preset.kind"
          class="hover:bg-accent group flex items-center gap-2.5 rounded-lg p-1.5 transition-colors duration-150"
        >
          <Tip label="试听">
            <button
              type="button"
              class="bg-media/12 text-media hover:bg-media hover:text-white flex size-8 shrink-0 items-center justify-center rounded-md transition-colors duration-150"
              @click="emit('preview', preset.kind)"
            >
              <AudioLines class="size-4 group-hover:hidden" />
              <Play class="hidden size-3.5 group-hover:block" />
            </button>
          </Tip>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-data">{{ preset.name }}</span>
            <span class="text-muted-foreground font-mono text-micro tabular-nums">
              {{ preset.duration.toFixed(1) }}s
            </span>
          </span>
          <Tip label="插入到播放头">
            <Button variant="outline" size="icon-xs" class="rounded-full" @click="emit('add', preset.kind)">
              <Plus />
            </Button>
          </Tip>
        </li>
      </ul>
    </section>

    <section v-if="lines.length">
      <h3 class="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-meta font-medium">
        本集台词
        <span class="font-mono tabular-nums opacity-70">{{ lines.length }}</span>
      </h3>
      <ul class="space-y-0.5">
        <li
          v-for="item in lines"
          :key="item.id"
          :class="
            cn(
              'group flex items-center gap-2.5 rounded-lg p-1.5 transition-colors duration-150',
              item.id === selected ? 'bg-selection/10' : 'hover:bg-accent',
            )
          "
        >
          <Tip label="试听">
            <button
              type="button"
              class="flex size-8 shrink-0 items-center justify-center rounded-md text-white"
              :style="{ backgroundColor: roster.get(item.assetId)?.color ?? '#8a8f98' }"
              @click="emit('listen', item.id)"
            >
              <Mic class="size-3.5 group-hover:hidden" />
              <Play class="hidden size-3.5 group-hover:block" />
            </button>
          </Tip>
          <button type="button" class="min-w-0 flex-1 text-left" @click="emit('select', item.id)">
            <span class="block truncate text-data">{{ item.line }}</span>
            <span class="text-muted-foreground block truncate text-micro">
              {{ roster.get(item.assetId)?.name ?? '未指定' }} · 镜 {{ item.index }} ·
              <span class="font-mono tabular-nums">{{ clock(item.start) }}</span>
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
