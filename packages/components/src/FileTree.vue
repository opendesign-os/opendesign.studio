<script setup lang="ts">
import { ChevronDown, File, Folder } from '@lucide/vue'
import type { FileNode } from './types'

defineProps<{ nodes: readonly FileNode[]; active?: string; depth?: number }>()

const emit = defineEmits<{ open: [path: string] }>()
</script>

<template>
  <ul class="text-sm">
    <li v-for="node in nodes" :key="node.path">
      <div
        v-if="node.kind === 'dir'"
        class="text-foreground flex items-center gap-1.5 rounded-md py-1.5"
        :style="{ paddingLeft: `${(depth ?? 0) * 0.875 + 0.5}rem` }"
      >
        <ChevronDown class="text-muted-foreground size-3.5 shrink-0" />
        <Folder class="text-muted-foreground size-3.5 shrink-0" />
        <span>{{ node.name }}</span>
      </div>

      <button
        v-else
        type="button"
        class="hover:bg-sidebar-accent flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left transition-colors"
        :class="active === node.path ? 'bg-brand/10 text-brand' : 'text-foreground'"
        :style="{ paddingLeft: `${(depth ?? 0) * 0.875 + 1.75}rem` }"
        @click="emit('open', node.path)"
      >
        <File class="size-3.5 shrink-0 opacity-70" />
        <span class="truncate">{{ node.name }}</span>
      </button>

      <FileTree
        v-if="node.children?.length"
        :nodes="node.children"
        :active="active"
        :depth="(depth ?? 0) + 1"
        @open="emit('open', $event)"
      />
    </li>
  </ul>
</template>
