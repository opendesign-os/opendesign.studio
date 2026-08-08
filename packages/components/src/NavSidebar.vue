<script setup lang="ts" generic="T extends string">
import { ChevronUp, Download } from '@lucide/vue'
import {
  Avatar,
  AvatarFallback,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@opendesign/shadcn'
import type { Account, NavAction, NavEntry, RecentEntry } from './types'

defineProps<{
  actions: readonly NavAction[]
  sections: readonly NavEntry<T>[]
  recents: readonly RecentEntry[]
  account: Account
  active?: string
  activeRecent?: string
}>()

const emit = defineEmits<{
  action: [id: string]
  select: [path: T]
  openRecent: [id: string]
}>()
</script>

<template>
  <Sidebar collapsible="offcanvas" class="border-r-0">
    <SidebarContent class="gap-0 px-3 pt-4">
      <SidebarGroup class="p-0">
        <SidebarMenu class="gap-0.5">
          <SidebarMenuItem v-for="item in actions" :key="item.id">
            <SidebarMenuButton
              class="text-foreground h-9 gap-3 px-2 text-[0.9375rem]"
              @click="emit('action', item.id)"
            >
              <component :is="item.icon" class="size-[1.15rem]" />
              <span>{{ item.label }}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarSeparator class="mx-0 my-3" />

      <SidebarGroup class="p-0">
        <SidebarMenu class="gap-0.5">
          <SidebarMenuItem v-for="item in sections" :key="item.path">
            <SidebarMenuButton
              :is-active="active === item.path"
              class="text-foreground h-9 gap-3 px-2 text-[0.9375rem]"
              @click="emit('select', item.path)"
            >
              <component :is="item.icon" class="size-[1.15rem]" />
              <span>{{ item.label }}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarSeparator class="mx-0 my-3" />

      <SidebarGroup class="gap-2 p-0">
        <SidebarGroupLabel class="text-muted-foreground h-auto px-2 text-[0.6875rem] tracking-[0.14em]">
          RECENTS
        </SidebarGroupLabel>

        <SidebarMenu class="gap-1">
          <SidebarMenuItem v-for="item in recents" :key="item.id">
            <button
              type="button"
              class="hover:bg-sidebar-accent w-full rounded-xl px-2 py-1.5 text-left transition-colors"
              :class="activeRecent === item.id && 'bg-card ring-border/70 shadow-xs ring-1'"
              @click="emit('openRecent', item.id)"
            >
              <p
                class="truncate text-sm font-medium"
                :class="activeRecent === item.id ? 'text-brand' : 'text-foreground'"
              >
                {{ item.title }}
              </p>
              <p class="text-muted-foreground truncate text-xs">{{ item.summary }}</p>
            </button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter class="gap-0 px-3 pb-4">
      <SidebarSeparator class="mx-0 mb-3" />
      <div class="flex items-center gap-3 px-2">
        <Avatar class="bg-primary text-primary-foreground size-9">
          <AvatarFallback class="bg-transparent text-sm font-medium">
            {{ account.initial }}
          </AvatarFallback>
        </Avatar>
        <div class="min-w-0 flex-1">
          <p class="text-foreground truncate text-sm font-medium">{{ account.name }}</p>
          <p class="text-muted-foreground truncate text-xs">{{ account.email }}</p>
        </div>
        <Download class="text-muted-foreground size-4 shrink-0" />
        <ChevronUp class="text-muted-foreground size-4 shrink-0" />
      </div>
    </SidebarFooter>
  </Sidebar>
</template>
