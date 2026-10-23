<script setup lang="ts">
import { Cpu, Palette } from '@lucide/vue'
import { ProviderCard } from '@opendesign/components'
import { useTheme } from '@opendesign/composables'
import type { Probe } from '@opendesign/models'
import { usePatchProvider, useProviders, useTestProvider } from '@opendesign/queries'
import { cn, Skeleton } from '@opendesign/shadcn'
import { ref } from 'vue'

const row =
  'text-data flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150 [&_svg]:size-4'

const sections = [
  { id: 'models', label: '模型', icon: Cpu },
  { id: 'look', label: '外观', icon: Palette },
]

const modes = [
  { dark: false, label: '浅色' },
  { dark: true, label: '深色' },
]

const section = ref('models')
const { dark } = useTheme()
const { data: providers, isPending } = useProviders()
const patch = usePatchProvider()
const test = useTestProvider()
const probes = ref<Record<string, Probe>>({})

function check(id: string) {
  test.mutate(id, {
    onSuccess: (probe) => {
      probes.value = { ...probes.value, [id]: probe }
    },
  })
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
        <h2 class="text-body font-semibold">{{ section === 'models' ? '模型' : '外观' }}</h2>
        <p class="text-muted-foreground mt-1 text-meta">
          {{
            section === 'models'
              ? '每类能力的默认模型、接入方式、生成参数与调度，生成任务按这里的配置提交'
              : '界面配色，记在本机'
          }}
        </p>
      </header>

      <div v-if="section === 'models'" class="space-y-2 p-6">
        <template v-if="isPending">
          <Skeleton v-for="index in 4" :key="index" class="h-16 rounded-xl" />
        </template>
        <ProviderCard
          v-for="provider in providers"
          v-else
          :key="provider.id"
          :provider="provider"
          :probe="probes[provider.id]"
          :testing="test.isPending.value && test.variables.value === provider.id"
          @patch="patch.mutate({ id: provider.id, patch: $event })"
          @test="check(provider.id)"
        />
      </div>

      <div v-else class="grid grid-cols-2 gap-3 p-6">
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
    </div>
  </div>
</template>
