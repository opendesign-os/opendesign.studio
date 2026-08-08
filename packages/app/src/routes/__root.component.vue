<script setup lang="ts">
import { Shapes } from '@lucide/vue'
import { NavSidebar, NavTabbar } from '@opendesign/components'
import { getPlatform } from '@opendesign/platform'
import { SidebarInset, SidebarProvider } from '@opendesign/shadcn'
import { Link, Outlet, useLocation, useRouter } from '@tanstack/vue-router'
import { type MenuItem, menu } from '../menu'

const { kind } = getPlatform()
const router = useRouter()
const location = useLocation()

function go(path: MenuItem['path']) {
  router.navigate({ to: path })
}
</script>

<template>
  <div v-if="kind === 'mobile'" class="flex h-screen min-h-0 flex-col overflow-hidden">
    <main class="min-h-0 flex-1 overflow-hidden">
      <Outlet />
    </main>
    <NavTabbar :items="menu" :active="location.pathname" @select="go" />
  </div>

  <SidebarProvider v-else :open="false" class="h-screen min-h-0 overflow-hidden">
    <NavSidebar :items="menu" :active="location.pathname" @select="go">
      <template #brand>
        <Link to="/" class="flex items-center justify-center">
          <Shapes class="text-primary size-7" />
        </Link>
      </template>
    </NavSidebar>
    <SidebarInset class="min-w-0 overflow-hidden">
      <Outlet />
    </SidebarInset>
  </SidebarProvider>
</template>
