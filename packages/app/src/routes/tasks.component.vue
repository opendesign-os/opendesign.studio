<script setup lang="ts">
import {
  ClipboardCheck,
  ClipboardList,
  Columns3,
  Flag,
  ListFilter,
  Plus,
  Rows3,
  Search,
  TimerOff,
} from '@lucide/vue'
import { BoardColumn, StatCard, TaskCard, TaskDialog } from '@opendesign/components'
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@opendesign/shadcn'
import { computed, ref } from 'vue'
import {
  columns,
  type Priority,
  people,
  priorities,
  type Task,
  type TaskStatus,
  tasks,
} from '../data/tasks'

const items = ref<Task[]>([...tasks])
const search = ref('')
const assignee = ref('all')
const priority = ref('all')
const view = ref<'board' | 'list'>('board')
const creating = ref(false)

const statuses = columns.map((column) => ({ id: column.id, label: column.label }))

const filtered = computed(() =>
  items.value.filter((task) => {
    const keyword = search.value.trim().toLowerCase()
    const matchesKeyword = !keyword || task.title.toLowerCase().includes(keyword)
    const matchesAssignee =
      assignee.value === 'all' || task.assignees.some((person) => person.id === assignee.value)
    const matchesPriority = priority.value === 'all' || task.priority === priority.value
    return matchesKeyword && matchesAssignee && matchesPriority
  }),
)

function countBy(value: Priority) {
  return filtered.value.filter((task) => task.priority === value).length
}

const stats = computed(() => [
  { label: 'Low Priority', value: countBy('low'), icon: Flag, tone: 'text-success' },
  { label: 'Medium Priority', value: countBy('medium'), icon: Flag, tone: 'text-chart-4' },
  { label: 'High Priority', value: countBy('high'), icon: Flag, tone: 'text-destructive' },
])

const totals = computed(() => [
  { label: 'Total Task', value: filtered.value.length, icon: ClipboardList, tone: 'text-chart-3' },
  {
    label: 'Total Task Done',
    value: filtered.value.filter((task) => task.status === 'completed').length,
    icon: ClipboardCheck,
    tone: 'text-success',
  },
  {
    label: 'Overdue',
    value: filtered.value.filter((task) => task.status === 'overdue').length,
    icon: TimerOff,
    tone: 'text-destructive',
  },
])

function inColumn(status: TaskStatus) {
  return filtered.value.filter((task) => task.status === status)
}

function toneOf(value: string) {
  return priorities.find((item) => item.id === value)
}

function resetFilters() {
  search.value = ''
  assignee.value = 'all'
  priority.value = 'all'
}

function formatDue(value: string) {
  if (!value) return '未设置'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/ (\d{4})$/, ', $1')
}

function create(payload: {
  title: string
  due: string
  assignees: typeof people
  priority: string
  status: string
  description: string
}) {
  items.value = [
    {
      id: `task-${Math.abs(payload.title.length * 31 + items.value.length)}-${items.value.length}`,
      title: payload.title,
      priority: payload.priority as Priority,
      assignees: payload.assignees.length ? payload.assignees : [],
      due: formatDue(payload.due),
      subtasks: 0,
      comments: 0,
      status: payload.status as TaskStatus,
    },
    ...items.value,
  ]
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex flex-wrap items-center gap-3 px-6 pt-5 pb-4">
      <div class="relative">
        <Search class="text-muted-foreground absolute top-2.5 left-3 size-4" />
        <Input v-model="search" placeholder="Search…" class="bg-card/80 h-9 w-56 pl-9" />
      </div>

      <div class="border-border/70 bg-card/80 flex items-center gap-0.5 rounded-lg border p-0.5">
        <Button
          variant="ghost"
          size="icon"
          class="size-7 rounded-md"
          :class="view === 'list' && 'bg-primary text-primary-foreground hover:bg-primary'"
          @click="view = 'list'"
        >
          <Rows3 class="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="size-7 rounded-md"
          :class="view === 'board' && 'bg-primary text-primary-foreground hover:bg-primary'"
          @click="view = 'board'"
        >
          <Columns3 class="size-4" />
        </Button>
      </div>

      <div class="ml-auto flex flex-wrap items-center gap-2">
        <Select v-model="assignee">
          <SelectTrigger class="bg-card/80 h-9 w-36">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            <SelectItem v-for="person in people" :key="person.id" :value="person.id">
              {{ person.name }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="priority">
          <SelectTrigger class="bg-card/80 h-9 w-32">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem v-for="item in priorities" :key="item.id" :value="item.id">
              <Flag class="size-3.5 fill-current" :class="item.tone" />
              {{ item.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" class="bg-card/80 h-9 gap-2" title="清空筛选" @click="resetFilters">
          <ListFilter class="size-4" />
          Filter
        </Button>

        <Button class="bg-brand text-brand-foreground hover:bg-brand/90 h-9 gap-2" @click="creating = true">
          <Plus class="size-4" />
          Create Task
        </Button>
      </div>
    </div>

    <div class="flex flex-wrap gap-6 px-6 pb-5">
      <div class="grid min-w-[20rem] flex-1 grid-cols-3 gap-3">
        <StatCard v-for="item in stats" :key="item.label" v-bind="item" />
      </div>
      <div class="grid min-w-[20rem] flex-1 grid-cols-3 gap-3">
        <StatCard v-for="item in totals" :key="item.label" v-bind="item" />
      </div>
    </div>

    <div
      v-if="view === 'board'"
      class="scroll-surface flex min-h-0 flex-1 gap-4 overflow-x-auto px-6 pb-2"
    >
      <BoardColumn
        v-for="column in columns"
        :key="column.id"
        :label="column.label"
        :count="inColumn(column.id).length"
        :icon="column.icon"
        :tone="column.tone"
        :surface="column.surface"
      >
        <TaskCard
          v-for="task in inColumn(column.id)"
          :key="task.id"
          :task="task"
          :priority="toneOf(task.priority)"
        />
        <p v-if="!inColumn(column.id).length" class="text-muted-foreground px-1 py-6 text-center text-xs">
          暂无任务
        </p>
      </BoardColumn>
    </div>

    <div v-else class="scroll-surface min-h-0 flex-1 overflow-y-auto px-6 pb-4">
      <table class="w-full text-sm">
        <thead class="text-muted-foreground text-left text-xs">
          <tr class="border-border/60 border-b">
            <th class="py-2 font-normal">Task</th>
            <th class="py-2 font-normal">Priority</th>
            <th class="py-2 font-normal">Assignee</th>
            <th class="py-2 font-normal">Due Date</th>
            <th class="py-2 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in filtered" :key="task.id" class="border-border/50 border-b">
            <td class="py-2.5 font-medium">{{ task.title }}</td>
            <td class="py-2.5">
              <span class="flex items-center gap-1.5" :class="toneOf(task.priority)?.tone">
                <Flag class="size-3.5 fill-current" />
                {{ toneOf(task.priority)?.label }}
              </span>
            </td>
            <td class="text-muted-foreground py-2.5">
              {{ task.assignees[0]?.name ?? '未指派' }}
              <span v-if="task.assignees.length > 1">+{{ task.assignees.length - 1 }}</span>
            </td>
            <td class="text-muted-foreground py-2.5">{{ task.due }}</td>
            <td class="text-muted-foreground py-2.5">
              {{ columns.find((column) => column.id === task.status)?.label }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <TaskDialog
      v-model:open="creating"
      :people="people"
      :priorities="priorities"
      :statuses="statuses"
      @submit="create"
    />
  </div>
</template>
