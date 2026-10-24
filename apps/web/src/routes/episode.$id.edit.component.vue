<script setup lang="ts">
import {
  Captions,
  Check,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Command,
  Expand,
  Eye,
  FileText,
  Film,
  Image,
  Layers as LayersIcon,
  ListChecks,
  Magnet,
  Maximize,
  Minus,
  PanelRightClose,
  PanelRightOpen,
  Play,
  PlayCircle,
  Plus,
  RectangleHorizontal,
  RectangleVertical,
  Redo2,
  Scissors,
  Search,
  Send,
  Shrink,
  Sparkles,
  Timer,
  Trash2,
  Undo2,
  Users,
  Video,
  Wand2,
} from '@lucide/vue'
import { tenth } from '@opendesign/common'
import {
  type Action,
  Brief,
  Checklist,
  type Destination,
  Elements,
  Format,
  Gallery,
  Layers,
  Library,
  Motion,
  Palette,
  Pipeline,
  Presets,
  Preview,
  Prompt,
  poster,
  Rail,
  Section,
  Stage,
  Status,
  Timeline,
  Timing,
  Tip,
  type Track,
  Transport,
  tones,
} from '@opendesign/components'
import { useHistory, useTheme } from '@opendesign/composables'
import type {
  Aspect,
  Camera,
  Frame,
  Placement,
  ShotPatch,
  ShotStatus,
  Slot,
} from '@opendesign/models'
import {
  formats,
  locate,
  MAX_DURATION,
  MIN_DURATION,
  moves,
  readiness,
  sequence,
  transitionLabel,
} from '@opendesign/models'
import {
  media,
  useAssets,
  useCreateTask,
  usePatchSeries,
  usePatchShot,
  useSeries,
  useShots,
  useSplitShot,
} from '@opendesign/queries'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Separator,
  Slider,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toggle,
} from '@opendesign/shadcn'
import { useRouter, useSearch } from '@tanstack/vue-router'
import {
  useElementSize,
  useEventListener,
  useFullscreen,
  useLocalStorage,
  useRafFn,
  useTimeoutFn,
} from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { dialog, useWorkspace } from '../composables/workspace'

type Key = 'dialogue'
type Owner = { placement: Placement; key: Key | null; start: number; end: number }
const FRAME = 1 / 30

const toggled = 'size-8 min-w-0 px-0 aria-pressed:bg-selection/10 aria-pressed:text-selection'
const slide =
  '[&>[data-slot=resizable-panel]]:transition-[flex-grow] [&>[data-slot=resizable-panel]]:duration-300 [&>[data-slot=resizable-panel]]:ease-out'
const ZOOM = { min: 8, max: 240 }
const GUTTER = 96

const search = useSearch({ from: '/episode/$id/edit' })
const router = useRouter()
const { dark } = useTheme()

const { episodeId, episode, seriesId } = useWorkspace()
const { data: series } = useSeries(seriesId)
const { data: assets } = useAssets(seriesId)
const { data: list } = useShots(episodeId)
const shotId = computed(() => search.value.shot ?? list.value?.[0]?.id ?? '')

const patch = usePatchShot()
const patchSeries = usePatchSeries()
const split = useSplitShot()
const generate = useCreateTask()

const time = ref(0)
const playing = ref(false)
const scale = ref(36)
const snap = ref(true)
const captions = ref(true)
const selected = ref<string | null>(null)
const panel = ref('shots')
const tab = ref('frame')
const shelf = ref(true)
const inspector = ref(true)
const easing = ref(false)
const shelfPanel = ref<{ collapse: () => void; expand: () => void } | null>(null)
const inspectorPanel = ref<{ collapse: () => void; expand: () => void } | null>(null)
const palette = ref(false)
const hidden = ref<string[]>([])
const locked = ref<string[]>([])
const dock = ref<HTMLElement | null>(null)
const bounds = useElementSize(dock)
const query = ref('')
const rate = ref(1)
const volume = useLocalStorage('editor-volume', 0.8)
const { isFullscreen, toggle: toggleScreen } = useFullscreen()

const library = computed(() => assets.value ?? [])
const placements = computed(() => sequence(list.value ?? []))
const total = computed(() => placements.value.at(-1)?.end ?? 0)
const shot = computed(() => list.value?.find((item) => item.id === shotId.value))
const placement = computed(() => placements.value.find((item) => item.shot.id === shotId.value))
const current = computed(() => locate(placements.value, time.value))
const local = computed(() => (current.value ? time.value - current.value.start : 0))
const size = computed(() => (series.value ? formats[series.value.aspect] : null))
const checks = computed(() => (shot.value ? readiness(shot.value, library.value) : []))

const staged = computed(() => current.value?.shot ?? null)

const framing = computed(
  () => tab.value === 'frame' && selected.value === null && current.value?.shot.id === shotId.value,
)

const splittable = computed(() => {
  const value = current.value
  if (!value) return false
  const at = time.value - value.start
  return at >= MIN_DURATION && at <= value.shot.duration - MIN_DURATION
})

const owners = computed(() => {
  const map = new Map<string, Owner>()
  for (const item of placements.value) {
    map.set(item.shot.id, { placement: item, key: null, start: item.start, end: item.end })
    for (const key of ['dialogue'] as const) {
      for (const part of item.shot[key]) {
        const start = item.start + part.start
        map.set(part.id, { placement: item, key, start, end: start + part.duration })
      }
    }
  }
  return map
})

const tracks = computed<Track[]>(() => {
  const rows = placements.value
  const flags = (id: string) => ({
    hidden: hidden.value.includes(id),
    locked: locked.value.includes(id),
  })
  return [
    {
      id: 'film',
      label: '画面',
      icon: Film,
      kind: 'film',
      sequential: true,
      ...flags('film'),
      clips: rows.map(({ shot: value, start }) => ({
        id: value.id,
        name: value.scene,
        badge: `镜 ${value.index}`,
        kind: 'film' as const,
        start,
        duration: value.duration,
        cover: poster(value, dark.value),
        tone: tones.shot[value.status],
        audio: value.dialogue.map((part) => ({
          start: part.start,
          duration: part.duration,
        })),
      })),
      marks: rows.slice(1).map(({ shot: value, start }) => ({
        id: value.id,
        at: start,
        label: transitionLabel[value.transition],
        muted: value.transition === 'cut',
      })),
    },
  ]
})

const cuts = computed(() =>
  [
    { key: episode.value?.landscape, label: '横屏成片', icon: RectangleHorizontal },
    { key: episode.value?.portrait, label: '竖屏成片', icon: RectangleVertical },
  ].flatMap((item) => (item.key ? [{ ...item, href: media(item.key) }] : [])),
)

const marked = computed(() => [shotId.value, ...(selected.value ? [selected.value] : [])])

const shelves: Destination[] = [
  { id: 'shots', label: '镜头', icon: Clapperboard, group: 'media' },
  { id: 'assets', label: '资产', icon: Users, group: 'media' },
  { id: 'camera', label: '运镜', icon: Video, group: 'camera' },
]

const hints: Record<string, string> = {
  shots: '搜索场景或画面描述',
  assets: '搜索角色、场景、道具',
}

const shelfTitle = computed(() => shelves.find((item) => item.id === panel.value)?.label ?? '')
const term = computed(() => query.value.trim().toLowerCase())

function matches(...fields: (string | undefined)[]) {
  return !term.value || fields.some((field) => field?.toLowerCase().includes(term.value))
}

const found = computed(() => ({
  shots: placements.value.filter(({ shot: value }) =>
    matches(value.scene, value.prompt, `镜 ${value.index}`),
  ),
  assets: library.value.filter((item) => matches(item.name, item.summary)),
}))

const totals = computed<Record<string, number>>(() => ({
  shots: found.value.shots.length,
  assets: found.value.assets.length,
}))

const empty = computed(() => Boolean(term.value) && totals.value[panel.value] === 0)

const counts = computed(() => {
  const value = shot.value
  return {
    elements: value ? value.dialogue.length : 0,
    unmet: checks.value.filter((item) => !item.ok).length,
  }
})

function rewrite(prompt: string) {
  const value = shot.value
  if (!value) return
  history.record(value.id, { prompt })
  for (const slot of ['first', 'last'] as const) {
    generate.mutate({ kind: 'keyframe', shotId: value.id, slot })
  }
}

const flow: Record<ShotStatus, { label: string; next: ShotStatus }[]> = {
  draft: [],
  keyframe: [],
  generating: [{ label: '生成完成', next: 'review' }],
  review: [
    { label: '通过', next: 'composed' },
    { label: '打回', next: 'draft' },
  ],
  composed: [{ label: '重生成', next: 'keyframe' }],
  failed: [{ label: '重试', next: 'keyframe' }],
}

const reviews = computed(() => (shot.value ? flow[shot.value.status] : []))
const moving = computed(() => (shot.value ? shot.value.move.kind !== 'static' : false))
const parallax = computed(() => shot.value?.layers.some((item) => item.depth < 1) ?? false)

const history = useHistory<ShotPatch>({
  read: (id) => list.value?.find((item) => item.id === id),
  apply: (id, next) => patch.mutate({ id, patch: next }),
})

function open(id: string) {
  if (id === shotId.value) return
  void router.navigate({
    to: '/episode/$id/edit',
    params: { id: episodeId.value },
    search: { shot: id },
    replace: true,
  })
}

function follow() {
  const id = current.value?.shot.id
  if (id) open(id)
}

function seek(value: number) {
  time.value = Math.min(total.value, Math.max(0, value))
  if (!playing.value) follow()
}

function choose(id: string) {
  const owner = owners.value.get(id)
  if (!owner) return
  selected.value = owner.key ? id : null
  tab.value = owner.key ? 'element' : 'frame'
  if (time.value < owner.start || time.value >= owner.end) time.value = owner.start
  open(owner.placement.shot.id)
}

function enter(id: string) {
  const owner = owners.value.get(id)
  if (!owner) return
  selected.value = null
  tab.value = 'frame'
  time.value = owner.start
  open(id)
}

function retime(id: string, start: number, span: number) {
  const owner = owners.value.get(id)
  if (!owner) return
  const { placement: home, key } = owner
  const value = home.shot
  if (!key) {
    history.record(value.id, {
      duration: tenth(Math.min(MAX_DURATION, Math.max(MIN_DURATION, span))),
    })
    return
  }
  const items = value[key] as { id: string; start: number; duration: number }[]
  const length = Math.max(0.1, Math.min(tenth(span), value.duration))
  const at = Math.min(Math.max(0, tenth(start - home.start)), tenth(value.duration - length))
  history.record(value.id, {
    [key]: items.map((part) => (part.id === id ? { ...part, start: at, duration: length } : part)),
  } as ShotPatch)
}

function remove(id: string) {
  const owner = owners.value.get(id)
  if (!owner?.key) return
  const value = owner.placement.shot
  const items = value[owner.key] as { id: string }[]
  history.record(value.id, { [owner.key]: items.filter((part) => part.id !== id) } as ShotPatch)
  if (selected.value === id) selected.value = null
}

function toggleCast(assetId: string) {
  const value = shot.value
  if (!value) return
  const cast = value.cast.includes(assetId)
    ? value.cast.filter((item) => item !== assetId)
    : [...value.cast, assetId]
  history.record(value.id, { cast })
}

function apply(kind: Camera) {
  const value = shot.value
  if (value) history.record(value.id, { move: { ...value.move, kind, ...moves[kind] } })
}

function setFrame(slot: Slot, frame: Frame) {
  const value = shot.value
  if (!value) return
  history.record(value.id, {
    move: slot === 'first' ? { ...value.move, from: frame } : { ...value.move, to: frame },
  })
}

function setAspect(aspect: Aspect) {
  if (series.value) patchSeries.mutate({ id: series.value.id, patch: { aspect } })
}

function setParallax(enabled: boolean) {
  const value = shot.value
  if (!value) return
  const depths = { back: 0.45, mid: 0.75, fore: 1 }
  history.record(value.id, {
    layers: value.layers.map((item) => ({ ...item, depth: enabled ? depths[item.plane] : 1 })),
  })
}

function cut() {
  const value = current.value
  if (!value || !splittable.value) return
  playing.value = false
  split.mutate(
    { id: value.shot.id, at: tenth(time.value - value.start) },
    {
      onSuccess: (created) => {
        history.clear()
        open(created.id)
      },
    },
  )
}

function skip(direction: -1 | 1) {
  const rows = placements.value
  const index = rows.findIndex((item) => item.shot.id === current.value?.shot.id)
  const here = rows[index]
  if (!here) return
  const target = direction < 0 && time.value - here.start > 0.3 ? here : rows[index + direction]
  if (target) seek(target.start)
}

function zoom(value: number) {
  scale.value = Math.round(Math.min(ZOOM.max, Math.max(ZOOM.min, value)))
}

function fit() {
  const el = dock.value
  if (!el || !total.value) return
  zoom((el.clientWidth - GUTTER - 64) / total.value)
}

function preview() {
  selected.value = null
  time.value = 0
  playing.value = true
}

function toggle(id: string, flag: 'hidden' | 'locked') {
  const flags = flag === 'hidden' ? hidden : locked
  flags.value = flags.value.includes(id)
    ? flags.value.filter((item) => item !== id)
    : [...flags.value, id]
}

const settle = useTimeoutFn(() => (easing.value = false), 320, { immediate: false })

function animate() {
  easing.value = true
  settle.start()
}

function openShelf(id: string) {
  if (shelf.value && panel.value === id) {
    animate()
    shelfPanel.value?.collapse()
    return
  }
  panel.value = id
  if (!shelf.value) {
    animate()
    shelfPanel.value?.expand()
  }
}

function showInspector(value: boolean) {
  animate()
  if (value) inspectorPanel.value?.expand()
  else inspectorPanel.value?.collapse()
}

function back() {
  void router.navigate({ to: '/episode/$id', params: { id: episodeId.value }, search: true })
}

const loop = useRafFn(
  ({ delta }) => {
    const next = time.value + (delta / 1000) * rate.value
    if (next >= total.value) {
      time.value = total.value
      playing.value = false
      return
    }
    time.value = next
  },
  { immediate: false },
)

watch(playing, (value) => {
  if (!value) {
    loop.pause()
    follow()
    return
  }
  if (time.value >= total.value - 0.05) time.value = 0
  loop.resume()
})

watch(
  placements,
  () => {
    const home = placement.value
    if (!home || playing.value) return
    if (time.value < home.start) time.value = home.start
    else if (time.value >= home.end) time.value = Math.max(home.start, home.end - FRAME)
  },
  { immediate: true },
)

watch(shotId, () => {
  const home = placement.value
  if (home && (time.value < home.start || time.value >= home.end)) time.value = home.start
  if (selected.value && owners.value.get(selected.value)?.placement.shot.id !== shotId.value) {
    selected.value = null
  }
})

watch([bounds.width, total], ([width, length], [before, previous]) => {
  if (width && length && (!before || !previous)) fit()
})

watch(panel, () => {
  query.value = ''
})

const actions = computed<Action[]>(() => [
  {
    id: 'play',
    group: '播放',
    label: playing.value ? '暂停' : '播放',
    hint: '空格',
    icon: Play,
    run: () => (playing.value = !playing.value),
  },
  { id: 'preview', group: '播放', label: '从头预览', icon: Eye, run: preview },
  { id: 'split', group: '播放', label: '在播放头分割镜头', hint: 'S', icon: Scissors, run: cut },
  {
    id: 'fullscreen',
    group: '播放',
    label: isFullscreen.value ? '退出全屏' : '全屏预览',
    hint: 'F',
    icon: isFullscreen.value ? Shrink : Expand,
    run: () => void toggleScreen(),
  },
  { id: 'fit', group: '播放', label: '时间轴适应宽度', icon: Maximize, run: fit },
  {
    id: 'captions',
    group: '播放',
    label: captions.value ? '隐藏字幕' : '显示字幕',
    icon: Captions,
    run: () => (captions.value = !captions.value),
  },
  {
    id: 'first',
    group: '生成',
    label: '生成首帧',
    icon: Sparkles,
    run: () =>
      shot.value && generate.mutate({ kind: 'keyframe', shotId: shot.value.id, slot: 'first' }),
  },
  {
    id: 'last',
    group: '生成',
    label: '生成尾帧',
    icon: Sparkles,
    run: () =>
      shot.value && generate.mutate({ kind: 'keyframe', shotId: shot.value.id, slot: 'last' }),
  },
  {
    id: 'video',
    group: '生成',
    label: '生成视频',
    icon: Clapperboard,
    run: () => shot.value && generate.mutate({ kind: 'video', shotId: shot.value.id }),
  },
  {
    id: 'episode',
    group: '生成',
    label: '一键生成整集',
    icon: Wand2,
    run: () => generate.mutate({ kind: 'episode', episodeId: episodeId.value }),
  },
  {
    id: 'compose',
    group: '生成',
    label: '整集提交出片',
    icon: Send,
    run: () => generate.mutate({ kind: 'compose', episodeId: episodeId.value }),
  },
  { id: 'undo', group: '编辑', label: '撤销', hint: 'Ctrl/⌘ Z', icon: Undo2, run: history.undo },
  {
    id: 'redo',
    group: '编辑',
    label: '重做',
    hint: 'Ctrl/⌘ Shift Z',
    icon: Redo2,
    run: history.redo,
  },
  {
    id: 'delete',
    group: '编辑',
    label: '删除选中元素',
    hint: 'Delete',
    icon: Trash2,
    run: () => selected.value && remove(selected.value),
  },
  { id: 'prev', group: '导航', label: '上一镜', hint: '↑', icon: ChevronLeft, run: () => skip(-1) },
  { id: 'next', group: '导航', label: '下一镜', hint: '↓', icon: ChevronRight, run: () => skip(1) },
  { id: 'board', group: '导航', label: '回到分镜表', icon: LayersIcon, run: back },
  {
    id: 'assets',
    group: '导航',
    label: '打开资产库',
    icon: Users,
    run: () => (dialog.value = 'assets'),
  },
])

useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  const mod = event.metaKey || event.ctrlKey
  const key = event.key.toLowerCase()
  if (mod && key === 'k') {
    event.preventDefault()
    palette.value = !palette.value
    return
  }
  const target = event.target instanceof HTMLElement ? event.target : null
  if (
    target?.isContentEditable ||
    target?.closest('[role="slider"], [role="dialog"]') ||
    ['INPUT', 'SELECT', 'TEXTAREA'].includes(target?.tagName ?? '')
  ) {
    return
  }
  if (mod && key === 'z') {
    event.preventDefault()
    if (event.shiftKey) history.redo()
    else history.undo()
    return
  }
  if (mod && key === 'y') {
    event.preventDefault()
    history.redo()
    return
  }
  if (mod) return
  if (event.key === ' ') {
    event.preventDefault()
    if (target instanceof HTMLElement) target.blur()
    playing.value = !playing.value
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    seek(time.value - (event.shiftKey ? 1 : FRAME))
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    seek(time.value + (event.shiftKey ? 1 : FRAME))
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    skip(-1)
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    skip(1)
  } else if (event.key === 'Home') {
    seek(0)
  } else if (event.key === 'End') {
    seek(total.value)
  } else if (key === 's') {
    cut()
  } else if (key === 'f') {
    void toggleScreen()
  } else if (event.key === '=' || event.key === '+') {
    zoom(scale.value * 1.25)
  } else if (event.key === '-') {
    zoom(scale.value / 1.25)
  } else if (event.key === 'Escape') {
    selected.value = null
  } else if ((event.key === 'Delete' || event.key === 'Backspace') && selected.value) {
    remove(selected.value)
  }
})
</script>

<template>
  <div class="flex h-full min-h-0">

    <Rail :entries="shelves" :active="shelf ? panel : ''" @select="openShelf">
      <template #footer>
        <Tip label="命令面板" shortcut="Ctrl K" side="right">
          <Button variant="ghost" size="icon" class="text-muted-foreground rounded-xl" @click="palette = true">
            <Command />
          </Button>
        </Tip>
      </template>
    </Rail>

    <ResizablePanelGroup direction="vertical" auto-save-id="editor-rows" class="min-w-0 flex-1">
      <ResizablePanel :default-size="66" :min-size="35">
        <ResizablePanelGroup
          direction="horizontal"
          auto-save-id="editor-columns"
          :class="easing && slide"
        >
          <ResizablePanel
            id="shelf"
            ref="shelfPanel"
            :order="1"
            :default-size="22"
            :min-size="14"
            :max-size="40"
            collapsible
            :collapsed-size="0"
            class="bg-card @container flex flex-col"
            @collapse="shelf = false"
            @expand="shelf = true"
          >
            <header class="flex h-10 shrink-0 items-center gap-2 px-3">
              <h2 class="text-body font-semibold">{{ shelfTitle }}</h2>
              <span
                v-if="totals[panel] !== undefined"
                class="text-muted-foreground text-meta font-mono tabular-nums"
              >
                {{ totals[panel] }}
              </span>
            </header>
            <div v-if="hints[panel]" class="relative mx-3 mb-1 shrink-0">
              <Search
                class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
              />
              <Input v-model="query" type="search" :placeholder="hints[panel]" class="pl-8" />
            </div>
            <div class="min-h-0 flex-1 overflow-y-auto">
              <p v-if="empty" class="text-muted-foreground text-meta px-3 py-10 text-center">
                没有匹配「{{ query.trim() }}」的内容
              </p>
              <Gallery
                v-else-if="panel === 'shots'"
                :placements="found.shots"
                :current="shotId"
                @select="enter"
              />
              <Library
                v-else-if="panel === 'assets'"
                :assets="found.assets"
                :cast="shot?.cast ?? []"
                @toggle="toggleCast"
              />
              <Presets v-else-if="shot" :move="shot.move" @apply="apply" />
            </div>
          </ResizablePanel>
          <Tip label="拖动调整宽度" side="right">
            <ResizableHandle v-show="shelf" />
          </Tip>

          <ResizablePanel id="stage" :order="2" :min-size="30" class="bg-background">
            <div
              :class="
                cn('bg-stage/60 @container flex h-full flex-col', isFullscreen && 'bg-stage fixed inset-0 z-40')
              "
            >
              <Preview v-if="size && series" :width="size.width" :height="size.height">
                <template #tools>
                  <Tip label="撤销" shortcut="Ctrl Z">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      :disabled="!history.canUndo.value"
                      @click="history.undo()"
                    >
                      <Undo2 />
                    </Button>
                  </Tip>
                  <Tip label="重做" shortcut="Ctrl Shift Z">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      :disabled="!history.canRedo.value"
                      @click="history.redo()"
                    >
                      <Redo2 />
                    </Button>
                  </Tip>
                  <template v-if="current">
                    <Separator orientation="vertical" class="mx-1.5 data-[orientation=vertical]:h-4" />
                    <span class="text-data shrink-0 font-semibold">镜 {{ current.shot.index }}</span>
                    <span v-if="framing && !playing" class="text-muted-foreground text-meta min-w-0 truncate">
                      拖动实线框调起幅、虚线框调落幅，右下角手柄缩放
                    </span>
                    <template v-else>
                      <span class="text-muted-foreground text-meta hidden min-w-0 truncate @lg:inline">
                        {{ current.shot.scene }}
                      </span>
                      <Status class="hidden shrink-0 @md:inline-flex" :status="current.shot.status" />
                    </template>
                  </template>
                </template>
                <Stage
                  v-if="staged && !hidden.includes('film')"
                  :shot="staged"
                  :assets="library"
                  :time="local"
                  :playing="playing"
                  :volume="volume"
                  :rate="rate"
                  :framing="framing"
                  :captions="captions"
                  :selected="selected"
                  @frame="setFrame"
                  @select="(id) => (id ? choose(id) : (selected = null))"
                />
                <template #actions>
                  <DropdownMenu v-if="cuts.length">
                    <Tip label="查看成片">
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="icon-sm">
                          <PlayCircle />
                        </Button>
                      </DropdownMenuTrigger>
                    </Tip>
                    <DropdownMenuContent align="end" class="min-w-36">
                      <DropdownMenuItem v-for="cut in cuts" :key="cut.label" as-child>
                        <a :href="cut.href" target="_blank" rel="noreferrer">
                          <component :is="cut.icon" />
                          {{ cut.label }}
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Format :model-value="series.aspect" @update:model-value="setAspect" />
                  <Tip v-if="!inspector" label="展开检查器">
                    <Button variant="ghost" size="icon-sm" @click="showInspector(true)">
                      <PanelRightOpen />
                    </Button>
                  </Tip>
                </template>
                <template #transport>
                  <Transport
                    v-model:playing="playing"
                    v-model:rate="rate"
                    v-model:volume="volume"
                    :time="time"
                    :duration="total"
                    @skip="skip"
                  >
                    <Tip :label="isFullscreen ? '退出全屏' : '全屏'" shortcut="F">
                      <Button variant="ghost" size="icon-sm" @click="toggleScreen()">
                        <Shrink v-if="isFullscreen" />
                        <Expand v-else />
                      </Button>
                    </Tip>
                  </Transport>
                </template>
              </Preview>
            </div>
          </ResizablePanel>

          <Tip label="拖动调整宽度" side="left">
            <ResizableHandle v-show="inspector" />
          </Tip>
          <ResizablePanel
            id="inspector"
            ref="inspectorPanel"
            :order="3"
            :default-size="24"
            :min-size="16"
            :max-size="40"
            collapsible
            :collapsed-size="0"
            class="bg-card @container flex flex-col"
            @collapse="inspector = false"
            @expand="inspector = true"
          >
            <div
              v-if="shot"
              class="border-border flex h-11 shrink-0 items-center gap-2 border-b px-3"
            >
              <h2 class="text-body shrink-0 font-semibold">镜 {{ shot.index }}</h2>
              <Status class="shrink-0" :status="shot.status" />
              <span class="text-muted-foreground text-meta min-w-0 truncate">{{ shot.scene }}</span>
              <Tip label="收起检查器">
                <Button variant="ghost" size="icon-sm" class="ml-auto shrink-0" @click="showInspector(false)">
                  <PanelRightClose />
                </Button>
              </Tip>
            </div>

            <Tabs v-if="shot" v-model="tab" class="min-h-0 flex-1 gap-0">
              <div class="border-border border-b p-2">
                <TabsList class="w-full">
                  <Tip label="画面">
                    <TabsTrigger value="frame">
                      <Image />
                      <span class="hidden @3xs:inline">画面</span>
                    </TabsTrigger>
                  </Tip>
                  <Tip label="元素">
                    <TabsTrigger value="element">
                      <LayersIcon />
                      <span class="hidden @3xs:inline">元素</span>
                      <span v-if="counts.elements" class="font-mono tabular-nums opacity-60">
                        {{ counts.elements }}
                      </span>
                    </TabsTrigger>
                  </Tip>
                  <Tip label="生成">
                    <TabsTrigger value="generate">
                      <Sparkles />
                      <span class="hidden @3xs:inline">生成</span>
                      <span v-if="counts.unmet" class="text-container font-mono tabular-nums">
                        {{ counts.unmet }}
                      </span>
                    </TabsTrigger>
                  </Tip>
                </TabsList>
              </div>

              <TabsContent value="frame" class="min-h-0 overflow-y-auto">
                <Section title="镜头信息" :icon="FileText">
                  <Brief
                    :shot="shot"
                    :assets="library"
                    :busy="patch.isPending.value || generate.isPending.value"
                    @rewrite="rewrite"
                  />
                </Section>
                <Section title="时长与转场" :icon="Timer">
                  <Timing
                    :duration="shot.duration"
                    :transition="shot.transition"
                    @change="history.record(shot.id, $event)"
                  />
                </Section>
                <Section
                  title="运镜"
                  :icon="Video"
                  :enabled="moving"
                  @update:enabled="apply($event ? 'push' : 'static')"
                >
                  <Motion :move="shot.move" @change="history.record(shot.id, { move: $event })" />
                </Section>
                <Section title="视差" :icon="LayersIcon" :enabled="parallax" @update:enabled="setParallax">
                  <Layers :layers="shot.layers" @change="history.record(shot.id, { layers: $event })" />
                </Section>
              </TabsContent>

              <TabsContent value="element" class="min-h-0 overflow-y-auto">
                <Elements
                  :shot="shot"
                  :assets="library"
                  :selected="selected"
                  @change="history.record(shot.id, $event)"
                  @select="(id) => (id ? choose(id) : (selected = null))"
                  @remove="remove"
                />
              </TabsContent>

              <TabsContent value="generate" class="min-h-0 overflow-y-auto">
                <Section title="就绪度" :icon="ListChecks">
                  <Checklist :items="checks" />
                </Section>
                <Section title="提示词" :icon="FileText">
                  <Prompt class="text-data" :prompt="shot.prompt" :assets="library" />
                </Section>
                <Section title="整集" :icon="Wand2">
                  <Button
                    size="xs"
                    variant="outline"
                    :disabled="generate.isPending.value"
                    @click="generate.mutate({ kind: 'episode', episodeId })"
                  >
                    <Wand2 />
                    一键生成整集
                  </Button>
                  <p class="text-muted-foreground mt-2 text-micro">
                    补齐资产参考图、首尾帧与视频，最后合成横屏与竖屏两版成片
                  </p>
                </Section>
                <Section title="关键帧与视频" :icon="Sparkles">
                  <Pipeline
                    :shot="shot"
                    :assets="library"
                    :busy="generate.isPending.value"
                    @generate="generate.mutate({ kind: 'keyframe', shotId: shot.id, slot: $event })"
                    @video="generate.mutate({ kind: 'video', shotId: shot.id })"
                    @select="dialog = 'assets'"
                  />
                </Section>
                <Section title="审核" :icon="Check">
                  <div class="flex flex-wrap items-center gap-2">
                    <Status :status="shot.status" />
                    <span v-if="!reviews.length" class="text-muted-foreground text-meta">
                      出完视频后在这里审核
                    </span>
                    <Button
                      v-for="action in reviews"
                      :key="action.next"
                      size="xs"
                      :variant="action.next === 'draft' ? 'outline' : 'default'"
                      :disabled="patch.isPending.value"
                      @click="history.record(shot.id, { status: action.next })"
                    >
                      {{ action.label }}
                    </Button>
                  </div>
                </Section>
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <Tip label="拖动调整高度">
        <ResizableHandle />
      </Tip>

      <ResizablePanel :default-size="40" :min-size="24" :max-size="62" class="bg-background">
        <div ref="dock" class="@container flex h-full flex-col">
          <div class="flex h-11 shrink-0 items-center gap-1 px-3">
            <Tip label="字幕">
              <Toggle v-model="captions" size="sm" :class="toggled">
                <Captions />
              </Toggle>
            </Tip>
            <Tip label="分割镜头" shortcut="S">
              <Button variant="ghost" size="icon-sm" :disabled="!splittable" @click="cut">
                <Scissors />
              </Button>
            </Tip>
            <Tip v-if="selected" label="删除选中元素" shortcut="Delete">
              <Button
                variant="ghost"
                size="icon-sm"
                class="text-destructive hover:text-destructive"
                @click="remove(selected)"
              >
                <Trash2 />
              </Button>
            </Tip>

            <div class="ml-auto flex items-center gap-1">
              <Tip label="吸附到片段边缘">
                <Toggle v-model="snap" size="sm" :class="toggled">
                  <Magnet />
                </Toggle>
              </Tip>
              <Separator orientation="vertical" class="mx-1 data-[orientation=vertical]:h-5" />
              <Tip label="缩小" shortcut="-">
                <Button variant="ghost" size="icon-sm" @click="zoom(scale / 1.25)">
                  <Minus />
                </Button>
              </Tip>
              <Slider
                class="hidden w-28 @2xl:flex"
                :model-value="[scale]"
                :min="ZOOM.min"
                :max="ZOOM.max"
                :step="1"
                aria-label="时间轴缩放"
                @update:model-value="(value) => value?.[0] !== undefined && zoom(value[0])"
              />
              <Tip label="放大" shortcut="=">
                <Button variant="ghost" size="icon-sm" @click="zoom(scale * 1.25)">
                  <Plus />
                </Button>
              </Tip>
              <Tip label="适应宽度">
                <Button variant="ghost" size="icon-sm" @click="fit">
                  <Maximize />
                </Button>
              </Tip>
            </div>
          </div>

          <Timeline
            :tracks="tracks"
            :duration="total"
            :time="time"
            :scale="scale"
            :snap="snap"
            :selected="marked"
            @seek="seek"
            @select="choose"
            @retime="retime"
            @mark="enter"
            @zoom="zoom"
            @toggle="toggle"
          />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>

    <Palette v-model:open="palette" :actions="actions" />
  </div>
</template>
