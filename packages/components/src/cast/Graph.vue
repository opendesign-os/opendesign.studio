<script setup lang="ts">
import { LayoutGrid, Plus } from '@lucide/vue'
import type { Asset, Relation, RelationKind } from '@opendesign/models'
import { relationKind, relationKindLabel, roleLabel } from '@opendesign/models'
import { cn } from '@opendesign/shadcn'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/controls/dist/style.css'
import type { Connection, Edge, Node } from '@vue-flow/core'
import { Handle, MarkerType, Panel, Position, useVueFlow, VueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import { useLocalStorage } from '@vueuse/core'
import { computed, nextTick, ref } from 'vue'
import Tip from '../layout/Tip.vue'
import { relationColor } from '../tone'
import Bond from './Bond.vue'

type Spot = { x: number; y: number }
type Card = { person: Asset; role: string; degree: number; lit: boolean; dim: boolean }

const props = defineProps<{
  people: Asset[]
  relations: Relation[]
  selected: string | null
  focused: string | null
}>()

const emit = defineEmits<{
  select: [id: string | null]
  focus: [id: string | null]
  connect: [from: string, to: string]
}>()

const FLOW = 'cast'
const RINGS = { lead: 210, support: 340, extra: 470 }

const spots = useLocalStorage<Record<string, Spot>>('cast-cards', {})
const filter = ref<RelationKind | null>(null)
const { fitView } = useVueFlow(FLOW)

const relation = computed(() => props.relations.find((item) => item.id === props.selected))

const lit = computed(() => {
  if (relation.value) return new Set([relation.value.from, relation.value.to])
  if (props.focused) {
    const near = props.relations
      .filter((item) => item.from === props.focused || item.to === props.focused)
      .flatMap((item) => [item.from, item.to])
    return new Set([props.focused, ...near])
  }
  if (filter.value) {
    return new Set(
      props.relations
        .filter((item) => item.kind === filter.value)
        .flatMap((item) => [item.from, item.to]),
    )
  }
  return null
})

function shines(item: Relation) {
  if (relation.value) return item.id === relation.value.id
  if (props.focused) return item.from === props.focused || item.to === props.focused
  if (filter.value) return item.kind === filter.value
  return false
}

function layout(): Record<string, Spot> {
  const groups = { lead: [] as Asset[], support: [] as Asset[], extra: [] as Asset[] }
  for (const person of props.people) groups[person.role ?? 'support'].push(person)
  const result: Record<string, Spot> = {}
  for (const [role, list] of Object.entries(groups) as [keyof typeof RINGS, Asset[]][]) {
    list.forEach((person, index) => {
      if (role === 'lead' && list.length === 1) {
        result[person.id] = { x: 0, y: 0 }
        return
      }
      const offset = role === 'lead' ? Math.PI : -Math.PI / 2
      const angle = offset + (index / list.length) * Math.PI * 2
      result[person.id] = {
        x: Math.round(Math.cos(angle) * RINGS[role]),
        y: Math.round(Math.sin(angle) * RINGS[role] * 0.75),
      }
    })
  }
  return result
}

const nodes = computed<Node<Card>[]>(() => {
  const fallback = layout()
  return props.people.map((person) => ({
    id: person.id,
    type: 'person',
    position: spots.value[person.id] ?? fallback[person.id] ?? { x: 0, y: 0 },
    data: {
      person,
      role: person.role ? roleLabel[person.role] : '',
      degree: props.relations.filter((item) => item.from === person.id || item.to === person.id)
        .length,
      lit: props.focused === person.id || (!!relation.value && !!lit.value?.has(person.id)),
      dim: !!lit.value && !lit.value.has(person.id),
    },
  }))
})

const edges = computed<Edge[]>(() =>
  props.relations.map((item) => {
    const shine = shines(item)
    return {
      id: item.id,
      source: item.from,
      target: item.to,
      type: 'bond',
      markerEnd: item.mutual
        ? undefined
        : { type: MarkerType.ArrowClosed, color: relationColor[item.kind], width: 18, height: 18 },
      data: {
        relation: item,
        lit: shine,
        dim: !!lit.value && !shine,
        choose: () => emit('select', item.id),
      },
    }
  }),
)

const legend = computed(() =>
  relationKind.options
    .map((kind) => ({
      kind,
      label: relationKindLabel[kind],
      count: props.relations.filter((item) => item.kind === kind).length,
    }))
    .filter((item) => item.count),
)

function store(id: string, position: Spot) {
  spots.value = { ...spots.value, [id]: { x: Math.round(position.x), y: Math.round(position.y) } }
}

async function arrange() {
  const next = { ...spots.value }
  for (const person of props.people) delete next[person.id]
  spots.value = next
  await nextTick()
  void fitView({ padding: 0.3, duration: 300 })
}

function link(connection: Connection) {
  if (connection.source !== connection.target) emit('connect', connection.source, connection.target)
}

function clear() {
  filter.value = null
  emit('select', null)
  emit('focus', null)
}
</script>

<template>
  <VueFlow
    :id="FLOW"
    :nodes="nodes"
    :edges="edges"
    :min-zoom="0.4"
    :max-zoom="1.6"
    :connection-radius="60"
    @nodes-initialized="fitView({ padding: 0.3 })"
    @node-click="({ node }) => emit('focus', node.id)"
    @edge-click="({ edge }) => emit('select', edge.id)"
    @pane-click="clear"
    @node-drag-stop="({ node }) => store(node.id, node.position)"
    @connect="link"
  >
    <Background :gap="24" :size="1.2" pattern-color="currentColor" class="text-foreground/15" />
    <Controls position="bottom-right" :show-interactive="false" />

    <Panel position="top-right">
      <Tip label="重新排列">
        <button
          type="button"
          class="bg-card border-border text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-lg border shadow-xs transition-colors duration-150"
          @click="arrange"
        >
          <LayoutGrid class="size-4" />
        </button>
      </Tip>
    </Panel>

    <Panel v-if="legend.length" position="bottom-left">
      <div class="bg-card/90 border-border flex flex-wrap items-center gap-0.5 rounded-lg border p-1 shadow-xs backdrop-blur">
        <button
          v-for="item in legend"
          :key="item.kind"
          type="button"
          :class="
            cn(
              'text-micro flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors duration-150',
              filter === item.kind ? 'bg-accent text-foreground font-medium' : 'text-muted-foreground hover:text-foreground',
            )
          "
          @click="filter = filter === item.kind ? null : item.kind"
        >
          <span class="size-1.5 rounded-full" :style="{ backgroundColor: relationColor[item.kind] }" />
          {{ item.label }}
          <span class="font-mono tabular-nums opacity-60">{{ item.count }}</span>
        </button>
      </div>
    </Panel>

    <template #node-person="{ data }">
      <div
        :class="
          cn(
            'group bg-card relative w-44 rounded-xl border px-3 py-2.5 shadow-sm transition-[box-shadow,opacity] duration-150',
            data.lit ? 'border-selection ring-selection/25 ring-4' : 'border-border hover:shadow-md',
            data.dim && 'opacity-35',
          )
        "
      >
        <div class="flex items-center gap-2.5">
          <span
            class="text-data flex size-9 shrink-0 items-center justify-center rounded-full font-semibold text-white"
            :style="{ backgroundColor: data.person.color }"
          >
            {{ data.person.name.slice(0, 1) }}
          </span>
          <span class="min-w-0">
            <span class="text-data block truncate font-semibold">{{ data.person.name }}</span>
            <span class="text-muted-foreground block text-micro">
              {{ data.role || '角色' }} · {{ data.degree }} 段关系
            </span>
          </span>
        </div>
        <p v-if="data.person.summary" class="text-muted-foreground mt-2 line-clamp-2 text-micro leading-relaxed">
          {{ data.person.summary }}
        </p>
        <Handle
          type="source"
          :position="Position.Right"
          class="!bg-primary !border-background flex !size-5 items-center justify-center !rounded-full !border-2 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        >
          <Plus class="pointer-events-none size-3" />
        </Handle>
        <Handle
          type="target"
          :position="Position.Top"
          :connectable-start="false"
          class="!size-px !min-h-0 !min-w-0 !border-0 !bg-transparent"
          :style="{ top: '50%' }"
        />
      </div>
    </template>

    <template #edge-bond="edge">
      <Bond v-bind="edge" />
    </template>
  </VueFlow>
</template>
