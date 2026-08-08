<script setup lang="ts" generic="T extends string">
import { Tabs, TabsList, TabsTrigger } from '@opendesign/shadcn'

defineProps<{
  items: readonly { id: string; label: string; path: T }[]
  active: string
}>()

const emit = defineEmits<{ select: [path: T] }>()
</script>

<template>
  <Tabs :model-value="active">
    <TabsList class="bg-card/70 ring-border/60 h-9 rounded-full p-1 ring-1">
      <TabsTrigger
        v-for="item in items"
        :key="item.id"
        :value="item.path"
        class="data-[state=active]:bg-background rounded-full px-5 text-sm data-[state=active]:shadow-sm"
        @click="emit('select', item.path)"
      >
        {{ item.label }}
      </TabsTrigger>
    </TabsList>
  </Tabs>
</template>
