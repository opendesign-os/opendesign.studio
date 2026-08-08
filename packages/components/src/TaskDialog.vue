<script setup lang="ts">
import { Flag, Paperclip, Sparkles, X } from '@lucide/vue'
import {
  Avatar,
  AvatarFallback,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@opendesign/shadcn'
import { ref } from 'vue'
import type { Option, Person } from './types'

const props = defineProps<{
  open: boolean
  people: readonly Person[]
  priorities: readonly Option[]
  statuses: readonly Option[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [
    payload: {
      title: string
      due: string
      assignees: Person[]
      priority: string
      status: string
      description: string
    },
  ]
}>()

const title = ref('')
const due = ref('')
const selected = ref<Person[]>([])
const priority = ref('')
const status = ref('')
const description = ref('')
const picker = ref('')

function add(id: unknown) {
  const person = props.people.find((item) => item.id === id)
  if (person && !selected.value.some((item) => item.id === person.id)) {
    selected.value = [...selected.value, person]
  }
  picker.value = ''
}

function remove(id: string) {
  selected.value = selected.value.filter((item) => item.id !== id)
}

function reset() {
  title.value = ''
  due.value = ''
  selected.value = []
  priority.value = ''
  status.value = ''
  description.value = ''
}

function close() {
  emit('update:open', false)
  reset()
}

function draft() {
  description.value = title.value
    ? `${title.value}: outline the deliverables, define acceptance criteria and share progress with the assignees.`
    : 'Describe the goal, deliverables and acceptance criteria for this task.'
}

function submit() {
  if (!title.value.trim()) return
  emit('submit', {
    title: title.value.trim(),
    due: due.value,
    assignees: selected.value,
    priority: priority.value || 'medium',
    status: status.value || 'todo',
    description: description.value,
  })
  close()
}
</script>

<template>
  <Dialog :open="open" @update:open="!$event && close()">
    <DialogContent
      :show-close-button="false"
      class="gap-0 overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-md"
    >
      <div
        class="text-border pointer-events-none absolute inset-x-0 top-0 h-16"
        style="
          background-image: radial-gradient(currentColor 1px, transparent 1px);
          background-size: 9px 9px;
          mask-image: linear-gradient(to bottom, black, transparent);
        "
      />

      <div class="scroll-surface relative max-h-[68vh] overflow-y-auto px-6 pt-8 pb-6">
        <DialogHeader class="text-center">
          <DialogTitle class="text-xl font-semibold">Create New Task</DialogTitle>
          <DialogDescription class="text-xs">
            Enter the details below to create and assign this task.
          </DialogDescription>
        </DialogHeader>

        <div class="mt-6 space-y-4">
          <div class="space-y-2">
            <Label for="task-title">Task</Label>
            <Input id="task-title" v-model="title" placeholder="Maintenance Coordination" />
          </div>

          <div class="space-y-2">
            <Label for="task-due">Due Date</Label>
            <Input id="task-due" v-model="due" type="date" />
          </div>

          <div class="space-y-2">
            <Label>Assign to</Label>
            <Select :model-value="picker" @update:model-value="add">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="Select User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="person in people" :key="person.id" :value="person.id">
                  {{ person.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div v-if="selected.length" class="space-y-2">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium">
                Selected
                <span class="text-muted-foreground ml-1 tabular-nums">{{ selected.length }}</span>
              </p>
              <button type="button" class="text-brand text-xs" @click="selected = []">
                Clear All
              </button>
            </div>

            <div
              v-for="person in selected"
              :key="person.id"
              class="border-border/70 flex items-center gap-3 rounded-xl border p-3"
            >
              <Avatar class="size-9" :class="person.tone">
                <AvatarFallback class="bg-transparent text-sm font-medium">
                  {{ person.initial }}
                </AvatarFallback>
              </Avatar>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{{ person.name }}</p>
                <p class="text-muted-foreground text-xs">Candidate ID: {{ person.code }}</p>
              </div>
              <button
                type="button"
                class="text-muted-foreground hover:text-destructive"
                @click="remove(person.id)"
              >
                <X class="size-4" />
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2">
              <Label>Priority</Label>
              <Select v-model="priority">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="item in priorities" :key="item.id" :value="item.id">
                    <Flag class="size-3.5 fill-current" :class="item.tone" />
                    {{ item.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>Status</Label>
              <Select v-model="status">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="item in statuses" :key="item.id" :value="item.id">
                    {{ item.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="task-description">Description</Label>
            <Textarea
              id="task-description"
              v-model="description"
              class="min-h-20 resize-none"
              placeholder="Add more detail about this task"
            />
            <Button
              size="sm"
              class="bg-brand text-brand-foreground hover:bg-brand/90 gap-1.5 rounded-full"
              @click="draft"
            >
              Generate with AI
              <Sparkles class="size-3.5" />
            </Button>
          </div>

          <div class="space-y-2">
            <Label>Add Attachment</Label>
            <button
              type="button"
              class="border-border/70 text-muted-foreground hover:border-brand/60 hover:text-brand flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-4 text-xs transition-colors"
            >
              <Paperclip class="size-3.5" />
              Click to upload a file
            </button>
          </div>
        </div>
      </div>

      <div
        class="border-border/60 bg-card/60 flex items-center justify-between gap-3 border-t px-6 py-4"
      >
        <Button variant="outline" class="rounded-lg" @click="close">Cancel</Button>
        <Button
          :disabled="!title.trim()"
          class="bg-brand text-brand-foreground hover:bg-brand/90 rounded-lg"
          @click="submit"
        >
          Create Task
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
