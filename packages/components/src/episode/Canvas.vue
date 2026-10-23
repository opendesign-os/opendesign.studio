<script setup lang="ts">
import type { Asset, Shot } from '@opendesign/models'
import { transitionLabel } from '@opendesign/models'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/controls/dist/style.css'
import type { Edge, Node } from '@vue-flow/core'
import { Handle, Position, useVueFlow, VueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import { computed } from 'vue'
import ShotCard from '../shot/ShotCard.vue'

const props = defineProps<{
  shots: Shot[]
  assets: Asset[]
  selected: string | null
  spotlight: string | null
}>()

const emit = defineEmits<{
  select: [id: string | null]
  open: [id: string]
  move: [id: string, x: number, y: number]
}>()

const FLOW = 'storyboard'

const { fitView } = useVueFlow(FLOW)

const nodes = computed<Node<{ shot: Shot }>[]>(() =>
  props.shots.map((shot) => ({
    id: shot.id,
    type: 'shot',
    position: { ...shot.position },
    data: { shot },
    selected: shot.id === props.selected,
  })),
)

const edges = computed<Edge[]>(() => {
  const ordered = [...props.shots].sort((a, b) => a.index - b.index)
  return ordered.slice(1).flatMap((shot, index) => {
    const previous = ordered[index]
    if (!previous) return []
    const active = props.selected === previous.id || props.selected === shot.id
    return [
      {
        id: `${previous.id}>${shot.id}`,
        source: previous.id,
        target: shot.id,
        label: shot.transition === 'cut' ? undefined : transitionLabel[shot.transition],
        class: active ? 'active' : undefined,
        animated: active,
      },
    ]
  })
})

function focus(id: string) {
  void fitView({ nodes: [id], duration: 300, maxZoom: 1, padding: 0.8 })
}

function fit() {
  void fitView({ duration: 300, padding: 0.1 })
}

defineExpose({ focus, fit })
</script>

<template>
  <VueFlow
    :id="FLOW"
    class="storyboard"
    :nodes="nodes"
    :edges="edges"
    :min-zoom="0.25"
    :max-zoom="2"
    :nodes-connectable="false"
    :snap-to-grid="true"
    :snap-grid="[8, 8]"
    fit-view-on-init
    @node-click="({ node }) => emit('select', node.id)"
    @node-double-click="({ node }) => emit('open', node.id)"
    @node-drag-stop="
      ({ node }) => emit('move', node.id, Math.round(node.position.x), Math.round(node.position.y))
    "
    @pane-click="emit('select', null)"
  >
    <Background :gap="24" :size="1.2" pattern-color="currentColor" class="text-foreground/15" />
    <Controls position="bottom-right" :show-interactive="false" />

    <template #node-shot="{ id, data, selected: active }">
      <Handle type="target" :position="Position.Left" :connectable="false" />
      <ShotCard
        class="w-[232px]"
        :shot="data.shot"
        :assets="assets"
        :selected="active"
        :dim="spotlight !== null && !data.shot.cast.includes(spotlight)"
        @open="emit('open', id)"
      />
      <Handle type="source" :position="Position.Right" :connectable="false" />
    </template>
  </VueFlow>
</template>

<style>
.storyboard .vue-flow__handle {
  width: 10px;
  height: 10px;
  border: 2px solid var(--card);
  border-radius: 9999px;
  background: color-mix(in oklab, var(--muted-foreground) 60%, transparent);
}

.storyboard .vue-flow__node.selected .vue-flow__handle {
  background: var(--selection);
}

.storyboard .vue-flow__edge-path {
  stroke: color-mix(in oklab, var(--muted-foreground) 50%, transparent);
  stroke-width: 1.5;
}

.storyboard .vue-flow__edge.active .vue-flow__edge-path {
  stroke: var(--selection);
  stroke-width: 2.25;
}

.storyboard .vue-flow__edge-textbg {
  fill: var(--card);
}

.storyboard .vue-flow__edge-text {
  fill: var(--muted-foreground);
  font-size: 10px;
}

.storyboard .vue-flow__controls {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: none;
}

.storyboard .vue-flow__controls-button {
  border-bottom: 1px solid var(--border);
  background: var(--card);
  color: var(--foreground);
}

.storyboard .vue-flow__controls-button:hover {
  background: var(--accent);
}

.storyboard .vue-flow__controls-button svg {
  fill: currentColor;
}
</style>
