<script setup lang="ts">
import { getPlatform } from '@opendesign/platform'
import { SidebarInset, SidebarProvider } from '@opendesign/ui'
import { Outlet } from '@tanstack/vue-router'
import AppSidebar from '../components/AppSidebar.vue'
import AppTabbar from '../components/AppTabbar.vue'

const { kind } = getPlatform()
</script>

<template>
  <div v-if="kind === 'mobile'" class="flex h-screen min-h-0 flex-col overflow-hidden">
    <main class="min-h-0 flex-1 overflow-hidden">
      <Outlet />
    </main>
    <AppTabbar />
  </div>

  <SidebarProvider v-else :open="false" class="h-screen min-h-0 overflow-hidden">
    <AppSidebar />
    <SidebarInset class="min-w-0 overflow-hidden">
      <Outlet />
    </SidebarInset>
  </SidebarProvider>
</template>
