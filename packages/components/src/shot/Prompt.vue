<script setup lang="ts">
import type { Asset } from '@opendesign/models'
import { computed } from 'vue'

const props = defineProps<{ prompt: string; assets: Asset[] }>()

type Part = { text: string; asset?: Asset; mention: boolean }

const parts = computed<Part[]>(() => {
  const out: Part[] = []
  let last = 0
  for (const match of props.prompt.matchAll(/@([^\s@，。、,.]+)/g)) {
    const at = match.index ?? 0
    if (at > last) out.push({ text: props.prompt.slice(last, at), mention: false })
    const name = match[1] ?? ''
    out.push({ text: name, asset: props.assets.find((item) => item.name === name), mention: true })
    last = at + match[0].length
  }
  if (last < props.prompt.length) out.push({ text: props.prompt.slice(last), mention: false })
  return out
})
</script>

<template>
  <p class="leading-relaxed">
    <template v-for="(part, index) in parts" :key="index">
      <span
        v-if="part.mention"
        class="mx-0.5 inline-flex items-center gap-1 rounded px-1 align-baseline"
        :class="part.asset ? '' : 'bg-destructive/15 text-destructive'"
        :style="
          part.asset
            ? { backgroundColor: `${part.asset.color}26`, color: part.asset.color }
            : undefined
        "
        :title="part.asset?.prompt ?? '没有这个资产'"
      >
        <span class="size-1 rounded-full" :style="{ backgroundColor: part.asset?.color }" />
        {{ part.text }}
      </span>
      <span v-else>{{ part.text }}</span>
    </template>
  </p>
</template>
