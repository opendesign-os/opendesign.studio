<script setup lang="ts">
import { Clapperboard, Image, Lock, Sparkles } from '@lucide/vue'
import type { Asset, Shot, Slot } from '@opendesign/models'
import { locked, ready, slotLabel } from '@opendesign/models'
import { Badge, Button, cn } from '@opendesign/shadcn'
import { computed } from 'vue'
import Tip from '../layout/Tip.vue'

const props = defineProps<{ shot: Shot; assets: Asset[]; busy: boolean }>()

const emit = defineEmits<{
  generate: [slot: Slot]
  video: []
  pick: [id: string]
}>()

const bound = computed(() => props.assets.filter((item) => props.shot.cast.includes(item.id)))
const stable = computed(() => bound.value.filter((item) => locked(item)))
const frames = computed(() =>
  (['first', 'last'] as Slot[]).map((slot) => ({
    slot,
    frame: props.shot.keyframes.find((item) => item.slot === slot),
  })),
)
const canRun = computed(() => ready(props.shot, props.assets))
const running = computed(() => props.shot.status === 'generating')

const step =
  'border-border bg-card z-10 flex size-6 shrink-0 items-center justify-center rounded-full border'
</script>

<template>
  <ol
    class="before:bg-border relative space-y-2.5 before:absolute before:top-3 before:bottom-3 before:left-[11.5px] before:w-px"
  >
    <li class="relative flex gap-2.5">
      <span :class="step">
        <Lock
          class="size-3"
          :class="stable.length === bound.length && bound.length ? 'text-success' : 'text-container'"
        />
      </span>
      <div class="border-border bg-background min-w-0 flex-1 rounded-lg border p-2">
        <p class="text-data">参考图 · {{ stable.length }}/{{ bound.length }} 已锁定</p>
        <div class="mt-1.5 flex flex-wrap gap-1">
          <button
            v-for="item in bound"
            :key="item.id"
            type="button"
            class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-micro transition-opacity duration-150 hover:opacity-80"
            :style="{ backgroundColor: `${item.color}26`, color: item.color }"
            @click="emit('pick', item.id)"
          >
            <span class="size-1 rounded-full" :style="{ backgroundColor: item.color }" />
            {{ item.name }}
          </button>
          <span v-if="!bound.length" class="text-muted-foreground text-meta">未绑定资产</span>
        </div>
      </div>
    </li>

    <li v-for="entry in frames" :key="entry.slot" class="relative flex gap-2.5">
      <span :class="step">
        <Image class="size-3" :class="entry.frame?.ready ? 'text-media' : 'text-muted-foreground'" />
      </span>
      <div
        :class="
          cn(
            'flex min-w-0 flex-1 items-center gap-2 rounded-lg border p-2',
            entry.frame?.ready ? 'border-border bg-background' : 'border-border border-dashed',
          )
        "
      >
        <span class="flex-1 text-data">{{ slotLabel[entry.slot] }}</span>
        <Badge :variant="entry.frame?.ready ? 'success' : 'neutral'">
          {{ entry.frame?.ready ? '已出图' : '未生成' }}
        </Badge>
        <Tip :label="`${entry.frame?.ready ? '重出' : '生成'}${slotLabel[entry.slot]}`">
          <Button
            variant="outline"
            size="icon-xs"
            :disabled="busy"
            @click="emit('generate', entry.slot)"
          >
            <Sparkles />
          </Button>
        </Tip>
      </div>
    </li>

    <li class="relative flex gap-2.5">
      <span :class="step">
        <Clapperboard class="size-3" :class="canRun ? 'text-primary' : 'text-muted-foreground'" />
      </span>
      <div
        :class="
          cn(
            'min-w-0 flex-1 rounded-lg border p-2.5',
            canRun ? 'border-border bg-background' : 'border-border border-dashed',
          )
        "
      >
        <p class="text-data font-medium">
          {{ running ? '视频生成中' : canRun ? '可以生成视频' : '前置条件未满足' }}
        </p>
        <p class="text-muted-foreground mt-1 text-meta leading-snug">
          {{
            canRun
              ? '首帧与锁定的参考图一起送进视频模型'
              : '补齐参考图与首帧后才能提交'
          }}
        </p>
        <Button
          size="sm"
          class="mt-2 h-7 w-full text-data"
          :disabled="busy || !canRun || running"
          @click="emit('video')"
        >
          {{ running ? '排队中…' : '生成视频' }}
        </Button>
      </div>
    </li>
  </ol>
</template>
