<script setup lang="ts">
import { ChevronLeft, ChevronRight, Moon, Sun } from '@lucide/vue'
import { NavSidebar, NavTabbar, WorkspaceTabs } from '@opendesign/components'
import { getPlatform } from '@opendesign/platform'
import { Button, SidebarInset, SidebarProvider, SidebarTrigger } from '@opendesign/shadcn'
import { Outlet, useLocation, useRouter } from '@tanstack/vue-router'
import { computed } from 'vue'
import { account, actions, recents, sections, workspaces } from '../data/nav'
import { dark, toggleTheme } from '../theme'

type SectionPath = (typeof sections)[number]['path']
type WorkspacePath = (typeof workspaces)[number]['path']

const { kind } = getPlatform()
const router = useRouter()
const location = useLocation()

const pathname = computed(() => location.value.pathname)

const workspace = computed<WorkspacePath>(() => {
  if (pathname.value.startsWith('/code')) return '/code'
  if (pathname.value.startsWith('/colab')) return '/colab'
  return '/'
})

const openedChat = computed(() => recents.find((item) => pathname.value === `/chats/${item.id}`))

function go(path: SectionPath | WorkspacePath) {
  router.navigate({ to: path })
}

function openChat(id: string) {
  router.navigate({ to: '/chats/$id', params: { id } })
}
</script>

<template>
  <div v-if="kind === 'mobile'" class="flex h-screen min-h-0 flex-col overflow-hidden">
    <header class="flex h-14 shrink-0 items-center justify-center px-3">
      <WorkspaceTabs :items="workspaces" :active="workspace" @select="go" />
    </header>
    <main class="surface-glow min-h-0 flex-1 overflow-hidden">
      <Outlet />
    </main>
    <NavTabbar :items="sections" :active="pathname" @select="go" />
  </div>

  <SidebarProvider
    v-else
    class="h-screen min-h-0 overflow-hidden"
    style="--sidebar-width: 17.5rem"
  >
    <NavSidebar
      :actions="actions"
      :sections="sections"
      :recents="recents"
      :account="account"
      :active="pathname"
      :active-recent="openedChat?.id"
      @select="go"
      @open-recent="openChat"
      @action="go('/')"
    />

    <SidebarInset class="min-w-0 overflow-hidden bg-transparent">
      <header
        class="border-border/50 grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b px-3"
      >
        <div class="text-muted-foreground flex items-center gap-0.5">
          <SidebarTrigger class="size-8" />
          <Button variant="ghost" size="icon" class="size-8" @click="router.history.back()">
            <ChevronLeft class="size-4" />
          </Button>
          <Button variant="ghost" size="icon" class="size-8" @click="router.history.forward()">
            <ChevronRight class="size-4" />
          </Button>
        </div>

        <WorkspaceTabs :items="workspaces" :active="workspace" @select="go" />

        <div class="flex items-center justify-end">
          <p v-if="openedChat" class="truncate text-sm">{{ openedChat.title }}</p>
          <Button
            v-else
            variant="ghost"
            size="icon"
            class="bg-card/70 ring-border/60 text-muted-foreground size-9 rounded-full ring-1"
            @click="toggleTheme"
          >
            <Sun v-if="dark" class="size-4" />
            <Moon v-else class="size-4" />
          </Button>
        </div>
      </header>

      <main class="surface-glow min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
