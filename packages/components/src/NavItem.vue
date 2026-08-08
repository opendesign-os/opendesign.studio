<script setup lang="ts">
import { SidebarMenuButton, SidebarMenuItem } from '@opendesign/shadcn'
import type { Component } from 'vue'

defineOptions({ inheritAttrs: false })

defineProps<{ label: string; icon: Component; active?: boolean }>()
</script>

<template>
  <SidebarMenuItem>
    <SidebarMenuButton
      v-bind="$attrs"
      :title="label"
      :is-active="active"
      class="text-muted-foreground h-auto flex-col gap-1.5 rounded-lg px-1 py-2.5 [&>svg]:size-5"
    >
      <component :is="icon" />
      <span class="w-full truncate text-center text-xs leading-none">{{ label }}</span>
    </SidebarMenuButton>
  </SidebarMenuItem>
</template>
