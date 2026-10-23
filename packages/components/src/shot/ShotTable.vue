<script setup lang="ts">
import { ArrowDown, ArrowUp, ChevronsUpDown } from '@lucide/vue'
import type { Asset, Shot } from '@opendesign/models'
import { cameraLabel, readiness, shotSizeLabel } from '@opendesign/models'
import { cn } from '@opendesign/shadcn'
import {
  type ColumnDef,
  createSortedRowModel,
  rowSortingFeature,
  type SortingState,
  sortFn_alphanumeric,
  sortFn_basic,
  tableFeatures,
  useTable,
} from '@tanstack/vue-table'
import { computed, ref } from 'vue'
import Prompt from './Prompt.vue'
import Status from './Status.vue'

const props = defineProps<{ shots: Shot[]; assets: Asset[] }>()
const emit = defineEmits<{ open: [id: string] }>()

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic },
})

const columns: ColumnDef<typeof features, Shot>[] = [
  { accessorKey: 'index', header: '镜号', sortFn: 'basic' },
  { accessorKey: 'scene', header: '场次', sortFn: 'alphanumeric' },
  { id: 'lens', header: '镜头', accessorFn: (row) => `${row.size} ${row.move.kind}` },
  { accessorKey: 'prompt', header: '画面' },
  { id: 'cast', header: '资产', accessorFn: (row) => row.cast.join(' ') },
  { id: 'ready', header: '就绪', accessorFn: (row) => row.cast.length },
  { accessorKey: 'duration', header: '时长', sortFn: 'basic' },
  { accessorKey: 'status', header: '状态', sortFn: 'alphanumeric' },
]

const sorting = ref<SortingState>([{ id: 'index', desc: false }])

const table = useTable({
  features,
  columns,
  data: computed(() => props.shots),
  state: computed(() => ({ sorting: sorting.value })),
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
  },
})

const byId = computed(() => new Map(props.assets.map((item) => [item.id, item])))
const visible = computed(() => table.getRowModel().rows)

const align: Record<string, string> = {
  index: 'w-12 text-right tabular-nums',
  scene: 'w-36',
  lens: 'w-20',
  prompt: 'min-w-[18rem]',
  cast: 'w-40',
  ready: 'w-20',
  duration: 'w-14 text-right tabular-nums',
  status: 'w-24',
}

function score(shot: Shot) {
  const list = readiness(shot, props.assets)
  return { done: list.filter((item) => item.ok).length, total: list.length, list }
}
</script>

<template>
  <div class="border-border bg-card overflow-hidden rounded-xl border">
    <table class="w-full border-collapse text-data">
      <thead class="bg-background">
        <tr v-for="group in table.getHeaderGroups()" :key="group.id">
          <th
            v-for="header in group.headers"
            :key="header.id"
            :class="
              cn(
                'border-border text-muted-foreground border-b px-3 py-2 text-left font-medium whitespace-nowrap',
                align[header.column.id],
              )
            "
          >
            <button
              type="button"
              class="hover:text-foreground inline-flex items-center gap-1 transition-colors duration-150"
              @click="header.column.toggleSorting()"
            >
              {{ header.column.columnDef.header }}
              <ArrowUp v-if="header.column.getIsSorted() === 'asc'" class="size-3" />
              <ArrowDown v-else-if="header.column.getIsSorted() === 'desc'" class="size-3" />
              <ChevronsUpDown v-else class="size-3 opacity-30" />
            </button>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="row in visible"
          :key="row.id"
          class="border-border hover:bg-accent cursor-pointer border-b transition-colors duration-150 last:border-b-0"
          @click="emit('open', row.original.id)"
        >
          <td :class="cn('px-3 py-2', align.index)">{{ row.original.index }}</td>
          <td :class="cn('text-muted-foreground truncate px-3 py-2', align.scene)">
            {{ row.original.scene }}
          </td>
          <td :class="cn('text-muted-foreground px-3 py-2', align.lens)">
            {{ shotSizeLabel[row.original.size] }} · {{ cameraLabel[row.original.move.kind] }}
          </td>
          <td :class="cn('px-3 py-2', align.prompt)">
            <Prompt class="line-clamp-2 text-data" :prompt="row.original.prompt" :assets="assets" />
            <p v-if="row.original.note" class="text-container mt-0.5 truncate text-micro">
              {{ row.original.note }}
            </p>
          </td>
          <td :class="cn('px-3 py-2', align.cast)">
            <span class="flex flex-wrap gap-1">
              <span
                v-for="id in row.original.cast"
                :key="id"
                class="inline-flex items-center gap-1 rounded px-1 text-micro"
                :style="{
                  backgroundColor: `${byId.get(id)?.color ?? '#888'}22`,
                  color: byId.get(id)?.color,
                }"
              >
                {{ byId.get(id)?.name ?? id }}
              </span>
              <span v-if="!row.original.cast.length" class="text-muted-foreground opacity-50">—</span>
            </span>
          </td>
          <td :class="cn('px-3 py-2', align.ready)">
            <span
              class="inline-flex items-center gap-1.5 font-mono tabular-nums"
              :class="
                score(row.original).done === score(row.original).total
                  ? 'text-success'
                  : 'text-container'
              "
              :title="
                score(row.original)
                  .list.filter((item) => !item.ok)
                  .map((item) => item.hint)
                  .join('；') || '前置条件齐备'
              "
            >
              {{ score(row.original).done }}/{{ score(row.original).total }}
            </span>
          </td>
          <td :class="cn('px-3 py-2', align.duration)">{{ row.original.duration.toFixed(1) }}s</td>
          <td :class="cn('px-3 py-2', align.status)">
            <Status :status="row.original.status" />
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="!visible.length" class="text-muted-foreground py-12 text-center text-data">
      没有符合条件的镜头
    </p>
  </div>
</template>
