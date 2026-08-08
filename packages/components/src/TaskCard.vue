<script setup lang="ts">
import {
  CalendarDays,
  CornerDownRight,
  Ellipsis,
  Flag,
  MessageSquare,
  UserRound,
} from '@lucide/vue'
import { Avatar, AvatarFallback, Card } from '@opendesign/shadcn'
import { computed } from 'vue'
import type { Option, TaskItem } from './types'

const props = defineProps<{ task: TaskItem; priority?: Option }>()

const lead = computed(() => props.task.assignees[0])
const extra = computed(() => props.task.assignees.length - 1)
</script>

<template>
  <Card class="border-border/60 bg-card gap-0 p-4 shadow-none transition-shadow hover:shadow-sm">
    <div class="flex items-start justify-between gap-2">
      <p class="text-sm leading-snug font-medium">{{ task.title }}</p>
      <button type="button" class="text-muted-foreground hover:text-foreground shrink-0">
        <Ellipsis class="size-4" />
      </button>
    </div>

    <dl class="mt-3 space-y-2 text-xs">
      <div class="flex items-center justify-between gap-3">
        <dt class="text-muted-foreground flex items-center gap-1.5">
          <Flag class="size-3.5" />
          Priority
        </dt>
        <dd class="flex items-center gap-1.5 font-medium" :class="priority?.tone">
          <Flag class="size-3.5 fill-current" />
          {{ priority?.label }}
        </dd>
      </div>

      <div class="flex items-center justify-between gap-3">
        <dt class="text-muted-foreground flex items-center gap-1.5">
          <UserRound class="size-3.5" />
          Assignee
        </dt>
        <dd class="flex min-w-0 items-center gap-1.5">
          <Avatar v-if="lead" class="size-5" :class="lead.tone">
            <AvatarFallback class="bg-transparent text-[0.625rem] font-medium">
              {{ lead.initial }}
            </AvatarFallback>
          </Avatar>
          <span class="truncate">{{ lead?.name }}</span>
          <span v-if="extra > 0" class="text-muted-foreground shrink-0">+{{ extra }}</span>
        </dd>
      </div>

      <div class="flex items-center justify-between gap-3">
        <dt class="text-muted-foreground flex items-center gap-1.5">
          <CalendarDays class="size-3.5" />
          Due Date
        </dt>
        <dd>{{ task.due }}</dd>
      </div>
    </dl>

    <div
      v-if="task.subtasks || task.comments"
      class="border-border/60 text-muted-foreground mt-3 flex items-center gap-2 border-t pt-3 text-xs"
    >
      <span v-if="task.subtasks" class="flex items-center gap-1.5">
        <CornerDownRight class="size-3.5" />
        {{ task.subtasks }} subtasks
      </span>
      <span v-if="task.subtasks && task.comments" class="opacity-50">·</span>
      <span v-if="task.comments" class="flex items-center gap-1.5">
        <MessageSquare class="size-3.5" />
        {{ task.comments }} Comments
      </span>
    </div>
  </Card>
</template>
