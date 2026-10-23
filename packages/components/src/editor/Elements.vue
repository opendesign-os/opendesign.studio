<script setup lang="ts">
import { AudioLines, Mic, Play, Trash2, Type, X, Zap } from '@lucide/vue'
import { tenth } from '@opendesign/common'
import type { Asset, FoleyKind, Shot, ShotPatch } from '@opendesign/models'
import { bubbleShapeLabel, effectStyleLabel, emotionLabel, foleyLabel } from '@opendesign/models'
import { Button, Field, FieldLabel, Input, ToggleGroup, ToggleGroupItem } from '@opendesign/shadcn'
import { computed } from 'vue'
import Picker from '../form/Picker.vue'
import Tip from '../layout/Tip.vue'

type Key = 'bubbles' | 'effects' | 'dialogue' | 'sounds'

const props = defineProps<{ shot: Shot; assets: Asset[]; selected: string | null }>()

const emit = defineEmits<{
  change: [patch: ShotPatch]
  select: [id: string | null]
  remove: [id: string]
  listen: [id: string]
}>()

const groups = computed(() => [
  {
    key: 'bubbles' as const,
    label: '气泡',
    icon: Type,
    items: props.shot.bubbles.map((item) => ({ id: item.id, text: item.text, start: item.start })),
  },
  {
    key: 'effects' as const,
    label: '特效字',
    icon: Zap,
    items: props.shot.effects.map((item) => ({ id: item.id, text: item.text, start: item.start })),
  },
  {
    key: 'dialogue' as const,
    label: '台词',
    icon: Mic,
    items: props.shot.dialogue.map((item) => ({ id: item.id, text: item.line, start: item.start })),
  },
  {
    key: 'sounds' as const,
    label: '音效',
    icon: AudioLines,
    items: props.shot.sounds.map((item) => ({ id: item.id, text: item.name, start: item.start })),
  },
])

const picked = computed(() => {
  const id = props.selected
  if (!id) return null
  const { bubbles, effects, dialogue, sounds } = props.shot
  const bubble = bubbles.find((item) => item.id === id)
  if (bubble) return { key: 'bubbles' as const, bubble, timing: bubble }
  const effect = effects.find((item) => item.id === id)
  if (effect) return { key: 'effects' as const, effect, timing: effect }
  const line = dialogue.find((item) => item.id === id)
  if (line) return { key: 'dialogue' as const, line, timing: line }
  const sound = sounds.find((item) => item.id === id)
  if (sound) return { key: 'sounds' as const, sound, timing: sound }
  return null
})

const speakers = computed(() =>
  Object.fromEntries(
    props.assets.filter((item) => item.kind === 'character').map((item) => [item.id, item.name]),
  ),
)

function edit(key: Key, next: Record<string, unknown>) {
  const list = props.shot[key] as { id: string }[]
  emit('change', {
    [key]: list.map((item) => (item.id === props.selected ? { ...item, ...next } : item)),
  } as ShotPatch)
}

function choose(key: Key, field: string, value: unknown) {
  if (typeof value === 'string' && value) edit(key, { [field]: value })
}

function time(key: Key, field: 'start' | 'duration', raw: string) {
  const value = Number(raw)
  const current = picked.value?.timing
  if (Number.isNaN(value) || !current) return
  const limit = props.shot.duration
  const next =
    field === 'start'
      ? Math.min(Math.max(0, value), limit - 0.1)
      : Math.min(Math.max(0.1, value), limit - current.start)
  edit(key, { [field]: tenth(next) })
}

function recast(kind: FoleyKind) {
  const sound = picked.value?.key === 'sounds' ? picked.value.sound : null
  if (!sound) return
  const name = sound.name === foleyLabel[sound.kind] ? foleyLabel[kind] : sound.name
  edit('sounds', { kind, name })
}

function place(key: Key, field: 'x' | 'y', raw: string) {
  const value = Number(raw)
  if (!Number.isNaN(value)) edit(key, { [field]: Math.min(100, Math.max(0, Math.round(value))) })
}
</script>

<template>
  <div v-if="picked" class="space-y-3 p-3">
    <template v-if="picked.key === 'bubbles'">
      <Field>
        <FieldLabel>气泡文字</FieldLabel>
        <Input
          :model-value="picked.bubble.text"
          @update:model-value="edit('bubbles', { text: String($event) })"
        />
      </Field>
      <Field>
        <FieldLabel>说话人</FieldLabel>
        <Picker
          :model-value="picked.bubble.assetId"
          :options="speakers"
          @update:model-value="edit('bubbles', { assetId: $event })"
        />
      </Field>
      <Field>
        <FieldLabel>形态</FieldLabel>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          class="w-full"
          :model-value="picked.bubble.shape"
          @update:model-value="choose('bubbles', 'shape', $event)"
        >
          <ToggleGroupItem
            v-for="(label, value) in bubbleShapeLabel"
            :key="value"
            :value="value"
            class="text-meta flex-1"
          >
            {{ label }}
          </ToggleGroupItem>
        </ToggleGroup>
      </Field>
    </template>

    <template v-else-if="picked.key === 'effects'">
      <Field>
        <FieldLabel>特效字</FieldLabel>
        <Input
          :model-value="picked.effect.text"
          @update:model-value="edit('effects', { text: String($event) })"
        />
      </Field>
      <Field>
        <FieldLabel>风格</FieldLabel>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          class="w-full"
          :model-value="picked.effect.style"
          @update:model-value="choose('effects', 'style', $event)"
        >
          <ToggleGroupItem
            v-for="(label, value) in effectStyleLabel"
            :key="value"
            :value="value"
            class="text-meta flex-1"
          >
            {{ label }}
          </ToggleGroupItem>
        </ToggleGroup>
      </Field>
    </template>

    <template v-else-if="picked.key === 'dialogue'">
      <Field>
        <FieldLabel>台词</FieldLabel>
        <Input
          :model-value="picked.line.line"
          @update:model-value="edit('dialogue', { line: String($event) })"
        />
      </Field>
      <div class="grid gap-2 @2xs:grid-cols-2">
        <Field>
          <FieldLabel>配音角色</FieldLabel>
          <Picker
            :model-value="picked.line.assetId"
            :options="speakers"
            @update:model-value="edit('dialogue', { assetId: $event })"
          />
        </Field>
        <Field>
          <FieldLabel>情绪</FieldLabel>
          <Picker
            :model-value="picked.line.emotion"
            :options="emotionLabel"
            @update:model-value="edit('dialogue', { emotion: $event })"
          />
        </Field>
      </div>
    </template>

    <div v-else class="grid gap-2 @2xs:grid-cols-2">
      <Field>
        <FieldLabel>音效类型</FieldLabel>
        <Picker :model-value="picked.sound.kind" :options="foleyLabel" @update:model-value="recast" />
      </Field>
      <Field>
        <FieldLabel>名称</FieldLabel>
        <Input
          :model-value="picked.sound.name"
          @update:model-value="edit('sounds', { name: String($event) })"
        />
      </Field>
    </div>

    <div class="grid gap-2 @2xs:grid-cols-2">
      <Field>
        <FieldLabel>入点（秒）</FieldLabel>
        <Input
          :model-value="picked.timing.start"
          type="number"
          step="0.1"
          class="font-mono tabular-nums"
          @change="time(picked.key, 'start', ($event.target as HTMLInputElement).value)"
        />
      </Field>
      <Field>
        <FieldLabel>时长（秒）</FieldLabel>
        <Input
          :model-value="picked.timing.duration"
          type="number"
          step="0.1"
          class="font-mono tabular-nums"
          @change="time(picked.key, 'duration', ($event.target as HTMLInputElement).value)"
        />
      </Field>
    </div>

    <div v-if="picked.key === 'bubbles' || picked.key === 'effects'" class="grid gap-2 @2xs:grid-cols-2">
      <Field v-for="field in (['x', 'y'] as const)" :key="field">
        <FieldLabel>{{ field.toUpperCase() }}（%）</FieldLabel>
        <Input
          :model-value="picked.key === 'bubbles' ? picked.bubble[field] : picked.effect[field]"
          type="number"
          step="1"
          class="font-mono tabular-nums"
          @change="place(picked.key, field, ($event.target as HTMLInputElement).value)"
        />
      </Field>
    </div>

    <div class="flex items-center gap-1 pt-1">
      <Tip v-if="picked.key === 'dialogue' || picked.key === 'sounds'" label="试听">
        <Button variant="outline" size="icon-sm" @click="selected && emit('listen', selected)">
          <Play />
        </Button>
      </Tip>
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

  <div v-else class="space-y-4 p-3">
    <p class="text-muted-foreground text-meta leading-relaxed">
      在时间轴或画布上选中元素来编辑；气泡和特效字可以直接在画布上拖动。
    </p>
    <section v-for="group in groups" :key="group.key">
      <h3 class="text-muted-foreground text-meta mb-1 flex items-center gap-1.5 font-medium">
        <component :is="group.icon" class="size-3.5" />
        {{ group.label }}
        <span class="font-mono tabular-nums opacity-70">{{ group.items.length }}</span>
      </h3>
      <ul class="space-y-0.5">
        <li v-for="item in group.items" :key="item.id">
          <button
            type="button"
            class="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-150"
            @click="emit('select', item.id)"
          >
            <span class="text-data min-w-0 flex-1 truncate">{{ item.text }}</span>
            <span class="text-muted-foreground shrink-0 font-mono text-micro tabular-nums">
              {{ item.start.toFixed(1) }}s
            </span>
          </button>
        </li>
        <li v-if="!group.items.length" class="text-muted-foreground text-meta px-2 py-1">无</li>
      </ul>
    </section>
  </div>
</template>
