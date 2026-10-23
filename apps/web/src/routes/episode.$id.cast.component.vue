<script setup lang="ts">
import { ArrowLeft, ArrowLeftRight, ArrowRight, Plus, Repeat, Trash2 } from '@lucide/vue'
import { Avatar, Picker, relationColor, Tip } from '@opendesign/components'
import Graph from '@opendesign/components/cast/Graph.vue'
import type { Relation } from '@opendesign/models'
import { relationKind, relationKindLabel, roleLabel } from '@opendesign/models'
import {
  useAssets,
  useCreateRelation,
  usePatchRelation,
  useRelations,
  useRemoveRelation,
} from '@opendesign/queries'
import { Button, cn, Input, Switch, Textarea } from '@opendesign/shadcn'
import { computed, ref } from 'vue'
import { useWorkspace } from '../composables/workspace'

const { seriesId } = useWorkspace()
const { data: assets } = useAssets(seriesId)
const { data: relations } = useRelations(seriesId)
const create = useCreateRelation()
const patch = usePatchRelation()
const remove = useRemoveRelation()

const selected = ref<string | null>(null)
const focused = ref<string | null>(null)
const from = ref('')
const to = ref('')
const partner = ref('')

const people = computed(() =>
  (assets.value ?? []).filter((item) => item.kind === 'character' && item.voice !== 'narrator'),
)
const roster = computed(() => new Map(people.value.map((item) => [item.id, item])))
const list = computed(() => relations.value ?? [])
const current = computed(() => list.value.find((item) => item.id === selected.value))
const person = computed(() => (focused.value ? roster.value.get(focused.value) : undefined))
const names = computed(() => Object.fromEntries(people.value.map((item) => [item.id, item.name])))

const ties = computed(() =>
  list.value
    .filter((item) => item.from === focused.value || item.to === focused.value)
    .map((item) => ({ relation: item, other: item.from === focused.value ? item.to : item.from })),
)

const others = computed(() =>
  Object.fromEntries(
    people.value.filter((item) => item.id !== focused.value).map((item) => [item.id, item.name]),
  ),
)

function degree(id: string) {
  return list.value.filter((item) => item.from === id || item.to === id).length
}

function arrow(relation: Relation, self: string) {
  if (relation.mutual) return ArrowLeftRight
  return relation.from === self ? ArrowRight : ArrowLeft
}

function connect(source: string, target: string) {
  const existing = list.value.find(
    (item) =>
      (item.from === source && item.to === target) || (item.from === target && item.to === source),
  )
  if (existing) {
    selected.value = existing.id
    return
  }
  create.mutate(
    {
      seriesId: seriesId.value,
      draft: { from: source, to: target, kind: 'friend', mutual: true, label: '', note: '' },
    },
    { onSuccess: (relation) => (selected.value = relation.id) },
  )
}

function add() {
  if (!from.value || !to.value || from.value === to.value) return
  connect(from.value, to.value)
  from.value = ''
  to.value = ''
}

function attach() {
  if (!focused.value || !partner.value) return
  connect(focused.value, partner.value)
  partner.value = ''
}

function focus(id: string | null) {
  focused.value = id
  selected.value = null
}

function retype(value: unknown) {
  const parsed = relationKind.safeParse(value)
  if (parsed.success && current.value)
    patch.mutate({ id: current.value.id, patch: { kind: parsed.data } })
}

function write(field: 'label' | 'note', event: Event) {
  const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value.trim()
  if (current.value && value !== current.value[field]) {
    patch.mutate({ id: current.value.id, patch: { [field]: value } })
  }
}

function swap() {
  const relation = current.value
  if (relation) patch.mutate({ id: relation.id, patch: { from: relation.to, to: relation.from } })
}

function drop() {
  const relation = current.value
  if (relation) remove.mutate(relation.id, { onSuccess: () => (selected.value = null) })
}
</script>

<template>
  <div class="flex h-full min-h-0">
    <div class="bg-muted/30 relative min-w-0 flex-1">
      <Graph
        :people="people"
        :relations="list"
        :selected="selected"
        :focused="focused"
        @select="selected = $event"
        @focus="focus"
        @connect="connect"
      />
      <p class="text-muted-foreground text-meta pointer-events-none absolute top-4 left-4">
        点角色聚焦，悬停角色从右侧 + 拖到另一个角色新建关系
      </p>
      <p
        v-if="!people.length"
        class="text-muted-foreground text-data absolute inset-0 flex items-center justify-center"
      >
        资产库里还没有角色
      </p>
    </div>

    <aside class="border-border bg-card flex w-80 shrink-0 flex-col border-l">
      <template v-if="current">
        <header class="border-border flex h-12 shrink-0 items-center gap-1 border-b px-2">
          <Tip label="返回">
            <Button variant="ghost" size="icon-sm" @click="selected = null">
              <ArrowLeft />
            </Button>
          </Tip>
          <h2 class="text-data font-semibold">编辑关系</h2>
          <Tip label="删除关系">
            <Button variant="ghost" size="icon-sm" class="text-destructive hover:text-destructive ml-auto" @click="drop">
              <Trash2 />
            </Button>
          </Tip>
        </header>

        <div :key="current.id" class="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
          <div class="flex items-center justify-between gap-2">
            <template v-for="(id, index) in [current.from, current.to]" :key="`${id}-${index}`">
              <component
                :is="current.mutual ? ArrowLeftRight : ArrowRight"
                v-if="index"
                class="size-4 shrink-0"
                :style="{ color: relationColor[current.kind] }"
              />
              <button
                type="button"
                class="hover:bg-accent/60 flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg py-2 transition-colors duration-150"
                @click="focus(id)"
              >
                <Avatar
                  :name="roster.get(id)?.name"
                  :color="roster.get(id)?.color"
                  class="text-body size-10"
                />
                <span class="text-data truncate">{{ roster.get(id)?.name ?? '已删除角色' }}</span>
              </button>
            </template>
          </div>

          <div class="flex items-center gap-2">
            <label for="relation-mutual" class="text-data flex-1">双向关系</label>
            <Tip v-if="!current.mutual" label="交换方向">
              <Button variant="ghost" size="icon-sm" class="text-muted-foreground" @click="swap">
                <Repeat />
              </Button>
            </Tip>
            <Switch
              id="relation-mutual"
              :model-value="current.mutual"
              @update:model-value="patch.mutate({ id: current.id, patch: { mutual: $event } })"
            />
          </div>

          <section class="space-y-1.5">
            <p class="text-muted-foreground text-meta">类型</p>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="kind in relationKind.options"
                :key="kind"
                type="button"
                :class="
                  cn(
                    'text-data flex items-center justify-center gap-1.5 rounded-md border py-1.5 transition-colors duration-150',
                    current.kind === kind
                      ? 'border-foreground/30 bg-accent text-foreground font-medium'
                      : 'border-border text-muted-foreground hover:text-foreground',
                  )
                "
                @click="retype(kind)"
              >
                <span class="size-1.5 rounded-full" :style="{ backgroundColor: relationColor[kind] }" />
                {{ relationKindLabel[kind] }}
              </button>
            </div>
          </section>

          <section class="space-y-1.5">
            <label for="relation-label" class="text-muted-foreground text-meta">关系</label>
            <Input
              id="relation-label"
              :model-value="current.label"
              placeholder="例如：十年前的恋人"
              maxlength="16"
              @change="write('label', $event)"
            />
          </section>

          <section class="space-y-1.5">
            <label for="relation-note" class="text-muted-foreground text-meta">备注</label>
            <Textarea
              id="relation-note"
              :model-value="current.note"
              rows="4"
              maxlength="120"
              placeholder="这段关系在剧情里的走向、伏笔"
              @change="write('note', $event)"
            />
          </section>
        </div>
      </template>

      <template v-else-if="person">
        <header class="border-border flex h-12 shrink-0 items-center gap-1 border-b px-2">
          <Tip label="返回">
            <Button variant="ghost" size="icon-sm" @click="focus(null)">
              <ArrowLeft />
            </Button>
          </Tip>
          <h2 class="text-data font-semibold">角色</h2>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <div class="border-border space-y-2 border-b p-4">
            <div class="flex items-center gap-3">
              <Avatar :name="person.name" :color="person.color" class="text-title size-12" />
              <div class="min-w-0">
                <p class="text-body font-semibold">{{ person.name }}</p>
                <p class="text-muted-foreground text-meta">
                  {{ person.role ? roleLabel[person.role] : '角色' }} · {{ ties.length }} 段关系
                </p>
              </div>
            </div>
            <p v-if="person.summary" class="text-data">{{ person.summary }}</p>
            <p class="text-muted-foreground line-clamp-3 text-meta leading-relaxed">{{ person.prompt }}</p>
          </div>

          <div class="p-2">
            <p class="text-muted-foreground px-2 py-1.5 text-micro font-medium tracking-[0.12em] uppercase">关系</p>
            <button
              v-for="tie in ties"
              :key="tie.relation.id"
              type="button"
              class="hover:bg-accent/60 flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors duration-150"
              @click="selected = tie.relation.id"
            >
              <component
                :is="arrow(tie.relation, person.id)"
                class="size-3.5 shrink-0"
                :style="{ color: relationColor[tie.relation.kind] }"
              />
              <Avatar
                :name="roster.get(tie.other)?.name"
                :color="roster.get(tie.other)?.color"
                class="text-micro size-6"
              />
              <span class="min-w-0 flex-1">
                <span class="text-data block truncate">{{ roster.get(tie.other)?.name ?? '已删除角色' }}</span>
                <span class="text-muted-foreground block truncate text-micro">
                  {{ relationKindLabel[tie.relation.kind] }}
                  <template v-if="tie.relation.label">· {{ tie.relation.label }}</template>
                </span>
              </span>
            </button>
            <p v-if="!ties.length" class="text-muted-foreground px-2 py-6 text-center text-meta">还没有关系</p>
          </div>
        </div>

        <footer class="border-border flex items-center gap-1.5 border-t p-3">
          <Picker v-model="partner" :options="others" placeholder="与谁建立关系" class="flex-1" />
          <Tip label="新建关系">
            <Button size="icon-sm" :disabled="!partner || create.isPending.value" @click="attach">
              <Plus />
            </Button>
          </Tip>
        </footer>
      </template>

      <template v-else>
        <header class="border-border flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <h2 class="text-data font-semibold">人物关系</h2>
          <span class="text-muted-foreground font-mono text-meta tabular-nums">{{ list.length }}</span>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto p-2">
          <button
            v-for="item in people"
            :key="item.id"
            type="button"
            class="hover:bg-accent/60 flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors duration-150"
            @click="focus(item.id)"
          >
            <Avatar :name="item.name" :color="item.color" class="text-data size-9" />
            <span class="min-w-0 flex-1">
              <span class="flex items-baseline gap-1.5">
                <span class="text-data font-medium">{{ item.name }}</span>
                <span class="text-muted-foreground text-micro">
                  {{ item.role ? roleLabel[item.role] : '角色' }} · {{ degree(item.id) }} 段关系
                </span>
              </span>
              <span class="text-muted-foreground block truncate text-micro">{{ item.summary }}</span>
            </span>
          </button>
          <p v-if="!people.length" class="text-muted-foreground px-4 py-10 text-center text-meta">
            还没有角色
          </p>
        </div>

        <footer class="border-border flex items-center gap-1.5 border-t p-3">
          <Picker v-model="from" :options="names" placeholder="角色" class="flex-1" />
          <ArrowLeftRight class="text-muted-foreground size-4 shrink-0" />
          <Picker v-model="to" :options="names" placeholder="角色" class="flex-1" />
          <Tip label="新建关系">
            <Button size="icon-sm" :disabled="!from || !to || from === to || create.isPending.value" @click="add">
              <Plus />
            </Button>
          </Tip>
        </footer>
      </template>
    </aside>
  </div>
</template>
