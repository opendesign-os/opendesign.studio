<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { AssetCard, AssetForm } from '@opendesign/components'
import type { Asset, AssetDraft } from '@opendesign/models'
import { assetKind, assetKindLabel, locked } from '@opendesign/models'
import {
  useAssets,
  useCreateAsset,
  useCreateTask,
  usePatchAsset,
  useRemoveAsset,
  useSeries,
} from '@opendesign/queries'
import { Button, cn } from '@opendesign/shadcn'
import { computed, ref, watch } from 'vue'
import { useWorkspace } from '../../composables/workspace'

const { seriesId } = useWorkspace()
const { data: series } = useSeries(seriesId)
const { data: assets } = useAssets(seriesId)
const create = useCreateAsset()
const patch = usePatchAsset()
const remove = useRemoveAsset()
const generate = useCreateTask()

const kind = ref('all')
const selected = ref<string | null>(null)
const drafting = ref(false)

const blank: AssetDraft = {
  kind: 'character',
  name: '',
  summary: '',
  prompt: '',
  color: '#4ba3d2',
  role: 'support',
  voice: 'warm-male',
}

const all = computed(() => assets.value ?? [])

const filters = computed(() => [
  { id: 'all', label: '全部', count: all.value.length },
  ...assetKind.options.map((item) => ({
    id: item,
    label: assetKindLabel[item],
    count: all.value.filter((entry) => entry.kind === item).length,
  })),
])

const rows = computed(() =>
  kind.value === 'all' ? all.value : all.value.filter((item) => item.kind === kind.value),
)

const loose = computed(() => all.value.filter((item) => !locked(item)).length)

watch(
  all,
  (list) => {
    if (!drafting.value && !selected.value && list.length) selected.value = list[0]?.id ?? null
  },
  { immediate: true },
)

const current = computed(() => all.value.find((item) => item.id === selected.value))

const draft = computed<AssetDraft>(() => {
  if (drafting.value || !current.value) return blank
  const { kind: entity, name, summary, prompt, color, role, voice } = current.value
  return { kind: entity, name, summary, prompt, color, role, voice }
})

const formKey = computed(() => (drafting.value ? 'new' : (selected.value ?? 'none')))
const busy = computed(() => create.isPending.value || patch.isPending.value)

function startDraft() {
  drafting.value = true
  selected.value = null
}

function select(id: string) {
  drafting.value = false
  selected.value = id
}

function lock(asset: Asset, referenceId: string) {
  patch.mutate({
    id: asset.id,
    patch: {
      references: asset.references.map((entry) =>
        entry.id === referenceId ? { ...entry, locked: !entry.locked } : entry,
      ),
    },
  })
}

function submit(value: AssetDraft) {
  if (drafting.value) {
    create.mutate(
      { seriesId: seriesId.value, draft: value },
      {
        onSuccess: (created) => {
          drafting.value = false
          selected.value = created.id
        },
      },
    )
    return
  }
  if (selected.value) patch.mutate({ id: selected.value, patch: value })
}

function drop() {
  if (drafting.value) {
    drafting.value = false
    return
  }
  if (selected.value) {
    remove.mutate(selected.value, { onSuccess: () => (selected.value = null) })
  }
}
</script>

<template>
  <header class="border-border flex h-12 shrink-0 items-center gap-2 border-b px-5 pr-12">
    <h2 class="text-body font-semibold">资产库</h2>
    <span class="text-muted-foreground text-meta">{{ series?.title }}</span>
    <span class="text-muted-foreground flex items-center gap-1.5 text-meta">
      <span :class="cn('size-1.5 rounded-full', loose ? 'bg-container' : 'bg-success')" />
      {{ loose ? `${loose} 个参考图未锁` : '参考图全部锁定' }}
    </span>
    <Button size="sm" class="ml-auto" @click="startDraft">
      <Plus />
      新建资产
    </Button>
  </header>

  <div class="flex min-h-0 flex-1">
    <nav class="bg-muted/40 border-border w-40 shrink-0 space-y-0.5 border-r p-2">
      <button
        v-for="item in filters"
        :key="item.id"
        type="button"
        :class="
          cn(
            'text-data flex w-full items-center rounded-md px-2 py-1.5 text-left transition-colors duration-150',
            kind === item.id
              ? 'bg-accent text-foreground font-medium'
              : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
          )
        "
        @click="kind = item.id"
      >
        <span class="flex-1">{{ item.label }}</span>
        <span class="font-mono text-micro tabular-nums opacity-70">{{ item.count }}</span>
      </button>
    </nav>

    <div class="min-h-0 flex-1 overflow-y-auto p-4">
      <div class="grid gap-2 xl:grid-cols-2">
        <AssetCard
          v-for="item in rows"
          :key="item.id"
          :asset="item"
          :active="item.id === selected && !drafting"
          @select="select"
          @toggle="lock(item, $event)"
          @generate="generate.mutate({ kind: 'image', assetId: item.id, view: $event })"
        />
      </div>
      <p v-if="!rows.length" class="text-muted-foreground text-data py-12 text-center">
        这一类还没有资产
      </p>
    </div>

    <aside class="border-border w-80 shrink-0 overflow-y-auto border-l p-4">
      <h3 class="text-muted-foreground mb-3 text-meta font-medium">
        {{ drafting ? '新建资产' : '编辑资产' }}
      </h3>
      <AssetForm
        :key="formKey"
        :value="draft"
        :busy="busy"
        :submit-label="drafting ? '创建' : '保存'"
        @submit="submit"
        @remove="drop"
      />
    </aside>
  </div>
</template>
