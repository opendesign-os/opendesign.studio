<script setup lang="ts">
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@opendesign/shadcn'
import { computed } from 'vue'
import type { Action } from '../types'

const props = defineProps<{ actions: Action[] }>()
const emit = defineEmits<{ run: [id: string] }>()
const open = defineModel<boolean>('open', { required: true })

const groups = computed(() => {
  const map = new Map<string, Action[]>()
  for (const action of props.actions)
    map.set(action.group, [...(map.get(action.group) ?? []), action])
  return [...map]
})

function run(id: string) {
  open.value = false
  emit('run', id)
}
</script>

<template>
  <CommandDialog v-model:open="open" title="命令面板" description="搜索并执行编辑器命令">
    <CommandInput placeholder="搜索命令…" />
    <CommandList>
      <CommandEmpty>没有匹配的命令</CommandEmpty>
      <CommandGroup v-for="[name, items] in groups" :key="name" :heading="name">
        <CommandItem v-for="item in items" :key="item.id" :value="item.id" @select="run(item.id)">
          <component :is="item.icon" v-if="item.icon" />
          {{ item.label }}
          <CommandShortcut v-if="item.hint">{{ item.hint }}</CommandShortcut>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>
