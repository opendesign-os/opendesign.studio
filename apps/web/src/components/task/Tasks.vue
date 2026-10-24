<script setup lang="ts">
import { Wand2 } from '@lucide/vue'
import { duration } from '@opendesign/common'
import { TaskRow, Tip } from '@opendesign/components'
import type { Task } from '@opendesign/models'
import { live } from '@opendesign/models'
import { useCancelTask, useRetryTask, useTasks } from '@opendesign/queries'
import { Button, Skeleton, ToggleGroup, ToggleGroupItem } from '@opendesign/shadcn'
import { computed, ref } from 'vue'

const props = defineProps<{ busy?: boolean }>()

const emit = defineEmits<{ open: [task: Task]; generate: [] }>()

const { data: tasks, isPending } = useTasks()
const cancel = useCancelTask()
const retry = useRetryTask()

const scope = ref('live')

const all = computed(() => tasks.value ?? [])
const spent = computed(() => all.value.reduce((total, item) => total + item.elapsed, 0))

const scopes = computed(() => [
  { id: 'live', label: '进行中', items: all.value.filter(live) },
  { id: 'failed', label: '失败', items: all.value.filter((item) => item.status === 'failed') },
  { id: 'all', label: '全部', items: all.value },
])

const rows = computed(() => scopes.value.find((item) => item.id === scope.value)?.items ?? [])
</script>

<template>
  <div class="flex max-h-[min(32rem,70vh)] flex-col">
    <header class="border-border flex items-center gap-2 border-b py-2 pr-2 pl-3">
      <h2 class="text-data font-semibold">任务</h2>
      <Tip label="一键生成整集">
        <Button variant="ghost" size="icon-sm" :disabled="props.busy" @click="emit('generate')">
          <Wand2 />
        </Button>
      </Tip>
      <ToggleGroup
        type="single"
        size="sm"
        class="ml-auto"
        :model-value="scope"
        @update:model-value="scope = typeof $event === 'string' && $event ? $event : 'live'"
      >
        <ToggleGroupItem v-for="item in scopes" :key="item.id" :value="item.id" class="text-meta px-2">
          {{ item.label }}
          <span class="font-mono tabular-nums opacity-60">{{ item.items.length }}</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </header>

    <div class="divide-border min-h-0 flex-1 divide-y overflow-y-auto">
      <div v-if="isPending" class="space-y-2 p-3">
        <Skeleton v-for="index in 3" :key="index" class="h-12" />
      </div>
      <template v-else>
        <TaskRow
          v-for="task in rows"
          :key="task.id"
          :task="task"
          @cancel="cancel.mutate($event)"
          @retry="retry.mutate($event)"
          @open="emit('open', $event)"
        />
        <p v-if="!rows.length" class="text-muted-foreground text-data py-10 text-center">没有任务</p>
      </template>
    </div>

    <footer class="border-border text-muted-foreground border-t px-3 py-2 text-micro">
      共 {{ all.length }} 个任务 · 累计耗时 {{ duration(spent) }}
    </footer>
  </div>
</template>
