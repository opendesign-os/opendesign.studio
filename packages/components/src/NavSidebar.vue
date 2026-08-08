<script setup lang="ts" generic="T extends string">
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
} from '@opendesign/shadcn'
import NavItem from './NavItem.vue'
import type { NavEntry } from './types'

defineProps<{ items: readonly NavEntry<T>[]; active?: string }>()

const emit = defineEmits<{ select: [path: T] }>()
</script>

<template>
  <Sidebar collapsible="none" class="shrink-0 border-r" style="--sidebar-width: 5rem">
    <SidebarHeader class="h-16 shrink-0 justify-center p-0">
      <slot name="brand" />
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup class="p-2 pt-0">
        <SidebarMenu>
          <NavItem
            v-for="item in items"
            :key="item.path"
            :label="item.label"
            :icon="item.icon"
            :active="active === item.path"
            @click="emit('select', item.path)"
          />
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
</template>
