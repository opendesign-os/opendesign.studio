<script setup lang="ts">
import { ChatComposer, QuickStartCard } from '@opendesign/components'
import { useRouter } from '@tanstack/vue-router'
import { computed } from 'vue'
import { quickStart } from '../data/chat'
import { account, recents } from '../data/nav'

const router = useRouter()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

function start() {
  const first = recents[0]
  if (first) router.navigate({ to: '/chats/$id', params: { id: first.id } })
}
</script>

<template>
  <div class="scroll-surface h-full overflow-y-auto">
    <div class="mx-auto flex min-h-full w-full max-w-[46rem] flex-col justify-center px-6 py-12">
      <div class="flex justify-center">
        <span
          class="bg-card/70 ring-border/60 flex items-center gap-2 rounded-full px-4 py-1.5 text-sm ring-1"
        >
          {{ account.plan }}
          <span class="text-muted-foreground">·</span>
          <button type="button" class="text-brand font-medium">Upgrade</button>
        </span>
      </div>

      <h1 class="mt-10 text-center text-[3.5rem] leading-tight font-semibold tracking-tight">
        {{ greeting }}, {{ account.name }}
      </h1>

      <ChatComposer
        class="mt-8"
        placeholder="How can I help you today?"
        :model="account.model"
        @submit="start"
      />

      <p class="text-muted-foreground mt-8 text-[0.6875rem] tracking-[0.14em]">QUICK START</p>

      <div class="mt-3 grid gap-3 sm:grid-cols-2">
        <QuickStartCard
          v-for="item in quickStart"
          :key="item.id"
          :title="item.title"
          :prompt="item.prompt"
          :icon="item.icon"
          @select="start"
        />
      </div>
    </div>
  </div>
</template>
