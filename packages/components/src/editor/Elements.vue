<script setup lang="ts">
import { Trash2, X } from '@lucide/vue'
import { tenth } from '@opendesign/common'
import type { Asset, Shot, ShotPatch } from '@opendesign/models'
import { emotionLabel } from '@opendesign/models'
import { Button, Field, FieldLabel, Input } from '@opendesign/shadcn'
import { computed } from 'vue'
import Picker from '../form/Picker.vue'
import Tip from '../layout/Tip.vue'

const props = defineProps<{ shot: Shot; assets: Asset[]; selected: string | null }>()

const emit = defineEmits<{
  change: [patch: ShotPatch]
  select: [id: string | null]
  remove: [id: string]
}>()

const picked = computed(() => props.shot.dialogue.find((item) => item.id === props.selected))

const speakers = computed(() =>
  Object.fromEntries(
    props.assets.filter((item) => item.kind === 'character').map((item) => [item.id, item.name]),
  ),
)

function edit(next: Record<string, unknown>) {
  emit('change', {
    dialogue: props.shot.dialogue.map((item) =>
      item.id === props.selected ? { ...item, ...next } : item,
    ),
  })
}

function time(field: 'start' | 'duration', raw: string) {
  const value = Number(raw)
  const current = picked.value
  if (Number.isNaN(value) || !current) return
  const limit = props.shot.duration
  const next =
    field === 'start'
      ? Math.min(Math.max(0, value), limit - 0.1)
      : Math.min(Math.max(0.1, value), limit - current.start)
  edit({ [field]: tenth(next) })
}
</script>

<template>
  <div v-if="picked" class="space-y-3 p-3">
    <Field>
      <FieldLabel>台词</FieldLabel>
      <Input :model-value="picked.line" @update:model-value="edit({ line: String($event) })" />
    </Field>
    <div class="grid gap-2 @2xs:grid-cols-2">
      <Field>
        <FieldLabel>说话人</FieldLabel>
        <Picker
          :model-value="picked.assetId"
          :options="speakers"
          @update:model-value="edit({ assetId: $event })"
        />
      </Field>
      <Field>
        <FieldLabel>情绪</FieldLabel>
        <Picker
          :model-value="picked.emotion"
          :options="emotionLabel"
          @update:model-value="edit({ emotion: $event })"
        />
      </Field>
    </div>

    <div class="grid gap-2 @2xs:grid-cols-2">
      <Field>
        <FieldLabel>入点（秒）</FieldLabel>
        <Input
          :model-value="picked.start"
          type="number"
          step="0.1"
          class="font-mono tabular-nums"
          @change="time('start', ($event.target as HTMLInputElement).value)"
        />
      </Field>
      <Field>
        <FieldLabel>时长（秒）</FieldLabel>
        <Input
          :model-value="picked.duration"
          type="number"
          step="0.1"
          class="font-mono tabular-nums"
          @change="time('duration', ($event.target as HTMLInputElement).value)"
        />
      </Field>
    </div>

    <div class="flex items-center gap-1 pt-1">
      <Tip label="取消选中" shortcut="Esc">
        <Button variant="ghost" size="icon-sm" class="text-muted-foreground" @click="emit('select', null)">
          <X />
        </Button>
      </Tip>
      <Tip label="删除" shortcut="Delete">
        <Button
          variant="ghost"
          size="icon-sm"
          class="text-destructive hover:text-destructive ml-auto"
          @click="selected && emit('remove', selected)"
        >
          <Trash2 />
        </Button>
      </Tip>
    </div>
  </div>

  <div v-else class="space-y-2 p-3">
    <p class="text-muted-foreground text-meta leading-relaxed">
      台词由剧本拆解生成，改了会同时影响字幕和视频提示词。
    </p>
    <ul class="space-y-0.5">
      <li v-for="item in shot.dialogue" :key="item.id">
        <button
          type="button"
          class="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150"
          @click="emit('select', item.id)"
        >
          <span class="text-data min-w-0 flex-1 truncate">{{ item.line }}</span>
          <span class="text-muted-foreground shrink-0 font-mono text-micro tabular-nums">
            {{ item.start.toFixed(1) }}s
          </span>
        </button>
      </li>
      <li v-if="!shot.dialogue.length" class="text-muted-foreground text-meta px-2 py-1">
        这个镜头没有台词
      </li>
    </ul>
  </div>
</template>
