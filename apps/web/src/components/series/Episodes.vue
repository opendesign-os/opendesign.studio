<script setup lang="ts">
import { Check, Plus } from '@lucide/vue'
import { fills, tones } from '@opendesign/components'
import { episodeStatusLabel } from '@opendesign/models'
import { useCreateEpisode, useEpisodes } from '@opendesign/queries'
import { cn } from '@opendesign/shadcn'
import { computed } from 'vue'
import { useWorkspace } from '../../composables/workspace'

const emit = defineEmits<{ open: [episodeId: string] }>()

const { episodeId, seriesId } = useWorkspace()
const { data: episodes } = useEpisodes(seriesId)

const create = useCreateEpisode()

const rows = computed(() => [...(episodes.value ?? [])].sort((a, b) => a.index - b.index))

function add() {
  create.mutate(
    { seriesId: seriesId.value, draft: { title: '未命名', hook: '' } },
    { onSuccess: (episode) => emit('open', episode.id) },
  )
}
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
        :class="cn('size-1.5 shrink-0 rounded-full', fills[tones.episode[item.status]])"
      />
      <Check :class="cn('size-3.5 shrink-0', item.id === episodeId ? 'opacity-100' : 'opacity-0')" />
    </button>
    <button
      type="button"
      class="hover:bg-accent text-muted-foreground hover:text-foreground text-data flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors duration-150 disabled:opacity-50"
      :disabled="create.isPending.value"
      @click="add"
    >
      <Plus class="size-3.5 shrink-0" />
      新建分集
    </button>
  </div>
</template>
