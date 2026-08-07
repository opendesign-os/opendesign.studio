<script setup lang="ts">
import { Shapes } from '@lucide/vue'
import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarMenu } from '@opendesign/ui'
import { Link, useLocation, useRouter } from '@tanstack/vue-router'
import { menu } from '../menu'
import NavItem from './NavItem.vue'

const router = useRouter()
const location = useLocation()
</script>

<template>
  <Sidebar collapsible="none" class="shrink-0 border-r" style="--sidebar-width: 5rem">
    <SidebarHeader class="h-16 shrink-0 justify-center p-0">
      <Link to="/" class="flex items-center justify-center">
        <Shapes class="text-primary size-7" />
      </Link>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup class="p-2 pt-0">
        <SidebarMenu>
          <NavItem
            v-for="item in menu"
            :key="item.path"
            :label="item.label"
            :icon="item.icon"
            :active="location.pathname === item.path"
            @click="router.navigate({ to: item.path })"
          />
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
</template>
