<script setup lang="ts">
import {
  Check,
  ChevronsUpDown,
  Clapperboard,
  FileText,
  ListChecks,
  LoaderCircle,
  Network,
  PlayCircle,
  Send,
  Settings,
  Table2,
  Workflow,
} from '@lucide/vue'
import { Avatar, Modal, Tip } from '@opendesign/components'
import type { Task } from '@opendesign/models'
import { live, ready, resume } from '@opendesign/models'
import {
  media,
  useAssets,
  useCandidates,
  useCreateTask,
  useEpisodes,
  useSeries,
  useShots,
  useTasks,
} from '@opendesign/queries'
import {
  Button,
  cn,
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@opendesign/shadcn'
import { useIsMutating } from '@tanstack/vue-query'
import { Link, Outlet, useRouter, useRouterState } from '@tanstack/vue-router'
import { computed, ref, watch } from 'vue'
import Assets from '../components/asset/Assets.vue'
import Episodes from '../components/series/Episodes.vue'
import Home from '../components/series/Home.vue'
import Series from '../components/series/Series.vue'
import Preferences from '../components/settings/Preferences.vue'
import Tasks from '../components/task/Tasks.vue'
import { type Dialog, dialog, recent, useWorkspace } from '../composables/workspace'

const crumb =
  'hover:bg-accent data-[state=open]:bg-accent text-body flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors duration-150'
const link =
  'text-muted-foreground hover:text-foreground data-[status=active]:bg-background data-[status=active]:text-foreground dark:data-[status=active]:bg-input/40 inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-data font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-[status=active]:shadow-xs [&_svg]:size-3.5 [&_svg]:shrink-0'

const router = useRouter()
const leaf = useRouterState({ select: (state) => state.matches.at(-1)?.fullPath })

const { episodeId, episode, seriesId } = useWorkspace()
const { data: series } = useSeries(seriesId)
const { data: shots } = useShots(episodeId)
const { data: assets } = useAssets(seriesId)
const { data: candidates } = useCandidates(episodeId)
const { data: episodes } = useEpisodes()
const { data: tasks } = useTasks()
const render = useCreateTask()
const saving = useIsMutating({ mutationKey: ['patch'] })
const saved = ref<Date | null>(null)
const menu = ref<'series' | 'episode' | 'tasks' | null>(null)

const rows = computed(() => shots.value ?? [])
const runnable = computed(() => rows.value.filter((shot) => ready(shot, assets.value ?? [])).length)

const signal = computed(() => {
  const list = tasks.value ?? []
  if (list.some((item) => item.status === 'failed')) return 'bg-destructive'
  return list.some(live) ? 'bg-media' : ''
})

const views = computed(() => [
  {
    to: '/episode/$id/script' as const,
    label: '剧本',
    icon: FileText,
    dot: !!candidates.value?.length,
  },
  { to: '/episode/$id/cast' as const, label: '人物', icon: Network, dot: false },
  { to: '/episode/$id' as const, label: '分镜', icon: Table2, dot: false },
  { to: '/episode/$id/canvas' as const, label: '画布', icon: Workflow, dot: false },
  { to: '/episode/$id/edit' as const, label: '剪辑', icon: Clapperboard, dot: false },
])

const status = computed(() => {
  if (saving.value) return '保存中…'
  if (!saved.value) return '自动保存'
  const clock = saved.value.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return `已保存 ${clock}`
})

watch(saving, (value, previous) => {
  if (!value && previous) saved.value = new Date()
})

watch(
  episodeId,
  (id) => {
    recent.value = id
  },
  { immediate: true },
)

function toggle(name: NonNullable<typeof menu.value>, open: boolean) {
  menu.value = open ? name : null
}

function show(name: Dialog) {
  menu.value = null
  dialog.value = name
}

function open(id: string) {
  const target = episodes.value?.find((item) => item.id === id)
  const view = views.value.find((item) => item.to === leaf.value)?.to ?? '/episode/$id'
  menu.value = null
  dialog.value = null
  void router.navigate({
    to: target && !target.shots ? '/episode/$id/script' : view,
    params: { id },
  })
}

function enter(id: string) {
  const target = resume((episodes.value ?? []).filter((item) => item.seriesId === id))
  if (target) open(target.id)
}

function jump(task: Task) {
  if (task.episodeId && task.shotId) {
    menu.value = null
    void router.navigate({
      to: '/episode/$id/edit',
      params: { id: task.episodeId },
      search: { shot: task.shotId },
    })
  } else if (task.episodeId) {
    open(task.episodeId)
  } else {
    if (task.seriesId !== seriesId.value) enter(task.seriesId)
    show('assets')
  }
}
</script>

<template>
  <div class="bg-background flex h-full flex-col">
    <header
      class="border-border grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b px-3"
    >
      <div class="flex min-w-0 items-center">
        <Tip label="作品台">
          <button
            type="button"
            class="bg-foreground text-background text-meta flex size-6 shrink-0 items-center justify-center rounded-md font-bold"
            @click="show('home')"
          >
            镜
          </button>
        </Tip>
        <span class="text-muted-foreground/40 mx-1.5 select-none">/</span>

        <Popover :open="menu === 'series'" @update:open="toggle('series', $event)">
          <PopoverTrigger as-child>
            <button type="button" :class="cn(crumb, 'max-w-48 shrink-0')">
              <Avatar
                :name="series?.title"
                :color="series?.color"
                class="size-4.5 rounded text-[10px]"
              />
              <span class="truncate">{{ series?.title ?? '…' }}</span>
              <ChevronsUpDown class="text-muted-foreground size-3 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" class="w-80 p-0">
            <Series @enter="enter" @show="show" />
          </PopoverContent>
        </Popover>
        <span class="text-muted-foreground/40 mx-0.5 select-none">/</span>

        <Popover :open="menu === 'episode'" @update:open="toggle('episode', $event)">
          <PopoverTrigger as-child>
            <button type="button" :class="crumb" :title="episode?.hook">
              <span class="truncate font-medium">
                第 {{ episode?.index ?? '' }} 集 · {{ episode?.title ?? '' }}
              </span>
              <ChevronsUpDown class="text-muted-foreground size-3 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" class="w-72 p-0">
            <Episodes @open="open" />
          </PopoverContent>
        </Popover>

        <span class="text-muted-foreground text-meta ml-2 hidden shrink-0 items-center gap-1 xl:flex">
          <LoaderCircle v-if="saving" class="size-3 animate-spin" />
          <Check v-else class="size-3" />
          {{ status }}
        </span>
      </div>

      <nav class="bg-muted/70 inline-flex items-center gap-0.5 rounded-lg p-0.5">
        <Link
          v-for="view in views"
          :key="view.to"
          :to="view.to"
          :params="{ id: episodeId }"
          :search="true"
          :active-options="{ exact: true, includeSearch: false }"
          :class="link"
        >
          <component :is="view.icon" />
          {{ view.label }}
          <span v-if="view.dot" class="bg-primary size-1.5 rounded-full" />
        </Link>
      </nav>

      <div class="flex items-center justify-end gap-1">
        <Popover :open="menu === 'tasks'" @update:open="toggle('tasks', $event)">
          <PopoverAnchor as-child>
            <span class="inline-flex">
              <Tip label="任务">
                <PopoverTrigger as-child>
                  <Button variant="ghost" size="icon-sm" class="aria-expanded:bg-accent relative">
                    <ListChecks />
                    <span
                      v-if="signal"
                      :class="cn('ring-background absolute top-1.5 right-1.5 size-1.5 rounded-full ring-2', signal)"
                    />
                  </Button>
                </PopoverTrigger>
              </Tip>
            </span>
          </PopoverAnchor>
          <PopoverContent align="end" class="w-96 p-0">
            <Tasks @open="jump" />
          </PopoverContent>
        </Popover>
        <Tip label="设置">
          <Button variant="ghost" size="icon-sm" @click="show('settings')">
            <Settings />
          </Button>
        </Tip>
        <Tip v-if="episode?.output" label="查看成片">
          <Button variant="ghost" size="icon-sm" as-child>
            <a :href="media(episode.output)" target="_blank" rel="noreferrer">
              <PlayCircle />
            </a>
          </Button>
        </Tip>
        <Tip :label="`整集提交出片 · ${runnable}/${rows.length} 个镜头就绪`">
          <Button
            size="sm"
            class="ml-1.5"
            :disabled="render.isPending.value || !rows.length"
            @click="render.mutate({ kind: 'compose', episodeId })"
          >
            <Send />
            {{ render.isPending.value ? '提交中…' : '提交出片' }}
          </Button>
        </Tip>
      </div>
    </header>

    <div class="min-h-0 flex-1">
      <Outlet />
    </div>

    <Modal v-model="dialog" name="home" title="作品台" class="h-[80vh] sm:max-w-5xl">
      <Home @enter="enter" />
    </Modal>
    <Modal v-model="dialog" name="assets" title="资产库" class="h-[85vh] sm:max-w-6xl">
      <Assets />
    </Modal>
    <Modal v-model="dialog" name="settings" title="设置" class="h-[40rem] sm:max-w-4xl">
      <Preferences />
    </Modal>
  </div>
</template>
