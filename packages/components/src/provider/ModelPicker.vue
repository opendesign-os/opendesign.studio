<script setup lang="ts">
import { Check, ChevronsUpDown, LoaderCircle } from '@lucide/vue'
import type { Model } from '@opendesign/models'
import {
  Button,
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxTrigger,
  ComboboxViewport,
  cn,
} from '@opendesign/shadcn'
import type { HTMLAttributes } from 'vue'
import { computed, ref } from 'vue'

const props = defineProps<{
  models: Model[]
  suggested?: string[]
  pending?: boolean
  error?: string
  placeholder?: string
  optional?: boolean
  disabled?: boolean
  class?: HTMLAttributes['class']
}>()

const value = defineModel<string>({ required: true })

const open = ref(false)
const search = ref('')

const groups = computed(() => {
  const suggested = props.suggested ?? []
  return [
    {
      label: '推荐',
      models: suggested.map((id) => props.models.find((item) => item.id === id) ?? { id }),
    },
    {
      label: '厂商模型',
      models: props.models.filter((item) => !suggested.includes(item.id)),
    },
  ].filter((group) => group.models.length)
})

const typed = computed(() => {
  const text = search.value.trim()
  const listed = groups.value.some((group) => group.models.some((item) => item.id === text))
  return listed ? '' : text
})

function clear() {
  value.value = ''
  open.value = false
}
</script>

<template>
  <Combobox v-model="value" v-model:open="open" :disabled="disabled">
    <ComboboxAnchor as-child :class="cn('w-56', props.class)">
      <ComboboxTrigger as-child>
        <Button variant="outline" size="sm" class="justify-between font-normal">
          <span :class="cn('truncate', value ? 'font-mono' : 'text-muted-foreground')">
            {{ value || placeholder }}
          </span>
          <ChevronsUpDown class="text-muted-foreground" />
        </Button>
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxList align="end" class="w-80">
      <ComboboxInput v-model="search" placeholder="搜索或输入模型 ID" />
      <ComboboxViewport>
        <p
          v-if="pending"
          class="text-muted-foreground flex items-center gap-1.5 px-3 pt-2 text-micro"
        >
          <LoaderCircle class="size-3 animate-spin" />
          正在拉取模型列表…
        </p>
        <p v-else-if="error" class="text-destructive px-3 pt-2 text-micro">{{ error }}</p>
        <ComboboxEmpty class="text-muted-foreground px-3 text-micro">
          没有可选的模型，直接输入模型 ID 即可
        </ComboboxEmpty>
        <ComboboxGroup v-for="group in groups" :key="group.label" :heading="group.label">
          <ComboboxItem v-for="model in group.models" :key="model.id" :value="model.id">
            <span class="min-w-0 flex-1 truncate font-mono">{{ model.id }}</span>
            <span
              v-if="model.name && model.name !== model.id"
              class="text-muted-foreground max-w-28 truncate text-micro"
            >
              {{ model.name }}
            </span>
            <ComboboxItemIndicator>
              <Check />
            </ComboboxItemIndicator>
          </ComboboxItem>
        </ComboboxGroup>
        <ComboboxGroup v-if="typed">
          <ComboboxItem :value="typed">
            使用
            <span class="min-w-0 truncate font-mono">{{ typed }}</span>
          </ComboboxItem>
        </ComboboxGroup>
        <ComboboxGroup v-if="optional && value">
          <ComboboxItem value="none" class="text-muted-foreground" @select.prevent="clear">
            不启用
          </ComboboxItem>
        </ComboboxGroup>
      </ComboboxViewport>
    </ComboboxList>
  </Combobox>
</template>
