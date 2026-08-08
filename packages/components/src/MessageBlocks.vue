<script setup lang="ts">
import type { Block } from './types'

defineProps<{ blocks: readonly Block[] }>()
</script>

<template>
  <div class="space-y-4">
    <template v-for="(block, index) in blocks" :key="index">
      <h3 v-if="block.kind === 'heading'" class="pt-2 text-[1.0625rem] font-semibold">
        {{ block.text }}
      </h3>

      <hr v-else-if="block.kind === 'divider'" class="border-border/60 my-6" />

      <p v-else class="text-[0.9375rem] leading-7">
        <span
          v-for="(span, spanIndex) in block.spans"
          :key="spanIndex"
          :class="span.strong && 'font-semibold'"
        >
          {{ span.text }}
        </span>
      </p>
    </template>
  </div>
</template>
