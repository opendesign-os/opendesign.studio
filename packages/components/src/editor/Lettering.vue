<script setup lang="ts" generic="K extends 'bubble' | 'effect'">
import { Type, Zap } from '@lucide/vue'
import type { BubbleShape, EffectStyle } from '@opendesign/models'
import { bubbleShapeLabel, effectStyleLabel, onomatopoeia } from '@opendesign/models'
import { cn } from '@opendesign/shadcn'
import { computed } from 'vue'

type Variant = K extends 'bubble' ? BubbleShape : EffectStyle
type Item = { id: string; text: string; start: number }

const props = defineProps<{ kind: K; items: Item[]; selected: string | null }>()

const emit = defineEmits<{
  add: [variant: Variant]
  select: [id: string]
}>()

const shapes: Record<BubbleShape, string> = {
  speech: 'rounded-[12px]',
  thought: 'rounded-full',
  shout: 'rounded-[3px] -skew-x-6 font-semibold',
  caption: 'rounded-[3px]',
}

const styles: Record<EffectStyle, string> = {
  impact: 'text-xl font-black tracking-tight -rotate-6',
  soft: 'text-base font-medium opacity-75',
  speed: 'text-lg font-bold italic tracking-[0.08em]',
  glow: 'text-lg font-bold text-white [text-shadow:0_0_10px_var(--primary)]',
}

const bubble = computed(() => props.kind === 'bubble')
const variants = computed(
  () => Object.entries(bubble.value ? bubbleShapeLabel : effectStyleLabel) as [Variant, string][],
)
</script>

<template>
  <div class="space-y-4 p-3">
    <section>
      <h3 class="text-muted-foreground mb-2 text-meta font-medium">
        {{ bubble ? '气泡样式' : '特效字样式' }} · 点一下加到播放头
      </h3>
      <ul class="grid grid-cols-[repeat(auto-fill,minmax(min(7rem,100%),1fr))] gap-2">
        <li v-for="[value, label] in variants" :key="value">
          <button type="button" class="group w-full text-left" @click="emit('add', value)">
            <span
              class="from-primary/20 to-media/25 group-hover:ring-border flex aspect-[4/3] items-center justify-center rounded-lg bg-gradient-to-br ring-offset-2 ring-offset-card transition-shadow duration-150 group-hover:ring-2"
            >
              <span
                v-if="bubble"
                :class="cn('bg-white px-2.5 py-1 text-meta text-black shadow-md', shapes[value as BubbleShape])"
              >
                {{ value === 'caption' ? '那年冬天' : '对白' }}
              </span>
              <span v-else :class="cn('text-foreground', styles[value as EffectStyle])">
                {{ onomatopoeia[value as EffectStyle] }}
              </span>
            </span>
            <span class="mt-1 block text-[11.5px]">{{ label }}</span>
          </button>
        </li>
      </ul>
    </section>

    <section>
      <h3 class="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-meta font-medium">
        本镜{{ bubble ? '气泡' : '特效字' }}
        <span class="font-mono tabular-nums opacity-70">{{ items.length }}</span>
      </h3>
      <ul class="space-y-0.5">
        <li v-for="item in items" :key="item.id">
          <button
            type="button"
            :class="
              cn(
                'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors duration-150',
                item.id === selected ? 'bg-selection/10' : 'hover:bg-accent',
              )
            "
            @click="emit('select', item.id)"
          >
            <Type v-if="bubble" class="text-primary size-3.5 shrink-0" />
            <Zap v-else class="text-container size-3.5 shrink-0" />
            <span class="min-w-0 flex-1 truncate text-data">{{ item.text }}</span>
            <span class="text-muted-foreground shrink-0 font-mono text-micro tabular-nums">
              {{ item.start.toFixed(1) }}s
            </span>
          </button>
        </li>
        <li v-if="!items.length" class="text-muted-foreground px-2 py-3 text-meta">
          还没有，点上面的样式添加
        </li>
      </ul>
    </section>
  </div>
</template>
