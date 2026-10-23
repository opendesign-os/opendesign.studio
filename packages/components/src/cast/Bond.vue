<script setup lang="ts">
import type { Relation } from '@opendesign/models'
import { relationKindLabel } from '@opendesign/models'
import { cn } from '@opendesign/shadcn'
import type { EdgeProps, GraphNode } from '@vue-flow/core'
import { BaseEdge, EdgeLabelRenderer, getStraightPath } from '@vue-flow/core'
import { computed } from 'vue'
import { relationColor } from '../tone'

type Data = { relation: Relation; lit: boolean; dim: boolean; choose: () => void }

const props = defineProps<EdgeProps<Data>>()

const GAP = 6

function center(node: GraphNode) {
  return {
    x: node.computedPosition.x + node.dimensions.width / 2,
    y: node.computedPosition.y + node.dimensions.height / 2,
  }
}

function border(node: GraphNode, toward: { x: number; y: number }) {
  const origin = center(node)
  const dx = toward.x - origin.x
  const dy = toward.y - origin.y
  const scale = Math.max(
    Math.abs(dx) / (node.dimensions.width / 2 + GAP),
    Math.abs(dy) / (node.dimensions.height / 2 + GAP),
  )
  return scale ? { x: origin.x + dx / scale, y: origin.y + dy / scale } : origin
}

const geometry = computed(() => {
  const source = border(props.sourceNode, center(props.targetNode))
  const target = border(props.targetNode, center(props.sourceNode))
  const [path, labelX, labelY] = getStraightPath({
    sourceX: source.x,
    sourceY: source.y,
    targetX: target.x,
    targetY: target.y,
  })
  return { path, labelX, labelY }
})

const color = computed(() => relationColor[props.data.relation.kind])
</script>

<template>
  <BaseEdge
    :id="id"
    :path="geometry.path"
    :marker-end="markerEnd"
    :interaction-width="18"
    :style="{
      stroke: color,
      strokeWidth: data.lit ? 2.5 : 1.5,
      strokeDasharray: data.relation.kind === 'secret' ? '6 4' : undefined,
      opacity: data.dim ? 0.18 : 1,
      transition: 'opacity 150ms',
    }"
  />
  <EdgeLabelRenderer>
    <button
      type="button"
      :class="
        cn(
          'nodrag nopan bg-card text-micro pointer-events-auto absolute flex items-center gap-1.5 rounded-full border px-2.5 py-1 shadow-xs transition-[opacity,box-shadow] duration-150',
          data.lit ? 'border-selection ring-selection/25 font-medium ring-3' : 'border-border hover:shadow-sm',
          data.dim && 'opacity-25',
        )
      "
      :style="{ transform: `translate(-50%, -50%) translate(${geometry.labelX}px, ${geometry.labelY}px)` }"
      @click="data.choose()"
    >
      <span class="size-1.5 rounded-full" :style="{ backgroundColor: color }" />
      {{ data.relation.label || relationKindLabel[data.relation.kind] }}
    </button>
  </EdgeLabelRenderer>
</template>
