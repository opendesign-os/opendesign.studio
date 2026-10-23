<script setup lang="ts">
import { Check, CircleAlert, LoaderCircle, RotateCcw, X } from '@lucide/vue'
import { duration } from '@opendesign/common'
import type { Task, TaskStatus } from '@opendesign/models'
import { live, taskKindLabel, taskStatusLabel } from '@opendesign/models'
import { cn, Progress } from '@opendesign/shadcn'
import Tip from '../layout/Tip.vue'

defineProps<{ task: Task }>()

const emit = defineEmits<{
  cancel: [id: string]
  retry: [id: string]
  open: [task: Task]
}>()

const icons = {
  queued: LoaderCircle,
  running: LoaderCircle,
  done: Check,
  failed: CircleAlert,
}

const inks: Record<TaskStatus, string> = {
  queued: 'text-muted-foreground',
  running: 'text-media',
  done: 'text-success',
  failed: 'text-destructive',
}

const action =
  'text-muted-foreground hover:bg-accent hover:text-foreground flex size-6 shrink-0 items-center justify-center rounded-md opacity-0 transition duration-150 group-hover:opacity-100 focus-visible:opacity-100'
</script>

<template>
  <article class="group hover:bg-accent/50 flex gap-2.5 px-3 py-2.5 transition-colors duration-150">
    <component
      :is="icons[task.status]"
      :class="
        cn('mt-0.5 size-3.5 shrink-0', inks[task.status], task.status === 'running' && 'animate-spin')
      "
    />

    <div class="min-w-0 flex-1">
      <button
        type="button"
        class="text-data block w-full truncate text-left font-medium hover:underline"
        @click="emit('open', task)"
      >
        {{ task.title }}
      </button>
      <p class="text-muted-foreground mt-0.5 truncate text-micro">
        {{ taskKindLabel[task.kind] }} · {{ task.model }} · {{ duration(task.elapsed) }}
      </p>
      <Progress
        v-if="task.status === 'running'"
        class="mt-2 h-1 [--primary:var(--media)]"
        :model-value="task.progress"
      />
      <p v-if="task.error" class="text-destructive mt-1 text-meta leading-snug">{{ task.error }}</p>
    </div>

    <span
      :class="
        cn(
          'shrink-0 pt-px font-mono text-micro tabular-nums',
          task.status === 'failed' ? 'text-destructive' : 'text-muted-foreground',
        )
      "
    >
      {{ task.status === 'running' ? `${task.progress}%` : taskStatusLabel[task.status] }}
    </span>

    <Tip v-if="task.status === 'failed'" label="重试">
      <button type="button" :class="action" @click="emit('retry', task.id)">
        <RotateCcw class="size-3.5" />
      </button>
    </Tip>
    <Tip v-else-if="live(task)" label="取消">
      <button type="button" :class="cn(action, 'hover:text-destructive')" @click="emit('cancel', task.id)">
        <X class="size-3.5" />
      </button>
    </Tip>
    <span v-else class="size-6 shrink-0" />
  </article>
</template>
