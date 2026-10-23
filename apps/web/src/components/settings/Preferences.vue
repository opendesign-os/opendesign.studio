<script setup lang="ts">
import { CircleUser, Cpu, LogOut, Palette } from '@lucide/vue'
import { Avatar } from '@opendesign/components'
import { useTheme } from '@opendesign/composables'
import { auth } from '@opendesign/queries'
import { Button, cn } from '@opendesign/shadcn'
import { useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import Models from './Models.vue'

const row =
  'text-data flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150 [&_svg]:size-4'

const sections = [
  {
    id: 'models',
    label: '模型',
    icon: Cpu,
    hint: '团队共用的模型厂商，以及每类生成任务使用的模型、参数与调度',
  },
  { id: 'look', label: '外观', icon: Palette, hint: '界面配色，记在本机' },
  { id: 'account', label: '账号', icon: CircleUser, hint: '当前登录的账号与所在团队' },
]

const modes = [
  { dark: false, label: '浅色' },
  { dark: true, label: '深色' },
]

const section = ref('models')
const current = computed(() => sections.find((item) => item.id === section.value))
const { dark } = useTheme()
const session = auth.useSession()
const team = auth.useActiveOrganization()
const client = useQueryClient()

async function leave() {
  await auth.signOut()
  client.clear()
}
</script>

<template>
  <div class="flex min-h-0 flex-1">
    <nav class="bg-muted/40 border-border w-44 shrink-0 space-y-0.5 border-r p-2">
      <p class="text-muted-foreground px-2 pt-1 pb-2 text-micro">设置</p>
      <button
        v-for="item in sections"
        :key="item.id"
        type="button"
        :class="
          cn(
            row,
            section === item.id
              ? 'bg-accent text-foreground font-medium'
              : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
          )
        "
        @click="section = item.id"
      >
        <component :is="item.icon" />
        {{ item.label }}
      </button>
    </nav>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <header class="border-border border-b px-6 py-4 pr-12">
        <h2 class="text-body font-semibold">{{ current?.label }}</h2>
        <p class="text-muted-foreground mt-1 text-meta">{{ current?.hint }}</p>
      </header>

      <Models v-if="section === 'models'" />

      <div v-else-if="section === 'look'" class="grid grid-cols-2 gap-3 p-6">
        <button
          v-for="mode in modes"
          :key="mode.label"
          type="button"
          :class="
            cn(
              'rounded-lg border p-2 text-left transition-shadow duration-150',
              dark === mode.dark ? 'border-primary ring-primary/30 ring-3' : 'border-border hover:border-foreground/20',
            )
          "
          @click="dark = mode.dark"
        >
          <span
            :class="
              cn(
                'flex h-24 flex-col gap-1.5 rounded-md p-3',
                mode.dark ? 'bg-[oklch(0.2_0.01_285)]' : 'bg-[oklch(0.97_0.005_285)]',
              )
            "
          >
            <span :class="cn('h-2 w-1/2 rounded-full', mode.dark ? 'bg-white/25' : 'bg-black/15')" />
            <span :class="cn('h-2 w-3/4 rounded-full', mode.dark ? 'bg-white/15' : 'bg-black/10')" />
            <span class="bg-primary mt-auto h-4 w-12 rounded" />
          </span>
          <span class="text-data mt-2 block px-1 font-medium">{{ mode.label }}</span>
        </button>
      </div>

      <div v-else class="space-y-4 p-6">
        <div class="flex items-center gap-3">
          <Avatar :name="session.data?.user.name" color="var(--primary)" class="text-body size-10" />
          <div class="min-w-0">
            <p class="text-body truncate font-medium">{{ session.data?.user.name }}</p>
            <p class="text-muted-foreground truncate text-meta">{{ session.data?.user.email }}</p>
          </div>
        </div>
        <div class="border-border text-data flex items-center justify-between rounded-lg border px-3 py-2">
          <span class="text-muted-foreground">团队</span>
          <span class="truncate">{{ team.data?.name ?? '…' }}</span>
        </div>
        <Button variant="outline" size="sm" @click="leave">
          <LogOut />
          退出登录
        </Button>
      </div>
    </div>
  </div>
</template>
