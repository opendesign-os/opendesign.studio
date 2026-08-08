<script setup lang="ts">
import { ArrowRight, GitBranch } from '@lucide/vue'
import { Badge, Card } from '@opendesign/shadcn'

defineProps<{
  name: string
  description: string
  language: string
  languageClass?: string
  files: number
  lines: number
  branch: string
  updated: string
  status: string
  fill: number
  accentClass?: string
}>()

const emit = defineEmits<{ open: [] }>()
</script>

<template>
  <Card
    class="group border-border/60 bg-card/85 relative gap-0 overflow-hidden p-6 pb-8 shadow-none transition-shadow hover:shadow-md"
  >
    <div class="flex items-start justify-between gap-6">
      <div class="flex min-w-0 gap-3">
        <span class="mt-2 size-2 shrink-0 rounded-full" :class="accentClass ?? 'bg-chart-3'" />
        <div class="min-w-0">
          <p class="truncate font-medium">{{ name }}</p>
          <p class="text-muted-foreground mt-1 text-sm">{{ description }}</p>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <Badge
          variant="secondary"
          class="text-success bg-success/10 gap-1.5 rounded-full px-2.5 py-1 text-xs font-normal"
        >
          <span class="bg-success size-1.5 rounded-full" />
          {{ status }}
        </Badge>

        <button
          type="button"
          class="text-brand bg-brand/10 hover:bg-brand/16 flex items-center gap-1 rounded-full px-3 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100"
          @click="emit('open')"
        >
          Open
          <ArrowRight class="size-3" />
        </button>
      </div>
    </div>

    <div class="text-muted-foreground mt-4 flex items-center gap-4 pl-5 text-xs">
      <Badge
        variant="secondary"
        class="rounded-md px-2 py-0.5 text-xs font-normal"
        :class="languageClass"
      >
        {{ language }}
      </Badge>
      <span>{{ files }} files</span>
      <span>{{ lines }} lines</span>
      <span class="flex items-center gap-1">
        <GitBranch class="size-3" />
        {{ branch }}
      </span>
      <span class="ml-auto">{{ updated }}</span>
    </div>

    <div class="bg-border/50 absolute inset-x-6 bottom-3 h-px">
      <div
        class="h-full rounded-full"
        :class="accentClass ?? 'bg-chart-3'"
        :style="{ width: `${Math.round(fill * 100)}%` }"
      />
    </div>
  </Card>
</template>
