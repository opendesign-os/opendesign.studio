<script setup lang="ts">
import { Lock, LockOpen, Sparkles } from '@lucide/vue'
import type { Asset, View } from '@opendesign/models'
import { assetKindLabel, locked, roleLabel, viewLabel, views, voiceLabel } from '@opendesign/models'
import { Badge, cn } from '@opendesign/shadcn'
import { computed } from 'vue'
import Tip from '../layout/Tip.vue'

const props = defineProps<{ asset: Asset; active: boolean }>()

const emit = defineEmits<{
  select: [id: string]
  toggle: [referenceId: string]
  generate: [view: View]
}>()

const slots = computed(() =>
  views.map((view) => ({
    view,
    reference: props.asset.references.find((item) => item.view === view),
  })),
)

const stable = computed(() => locked(props.asset))
</script>

<template>
  <article
    :class="
      cn(
        'rounded-xl border transition-colors duration-150',
        active ? 'border-primary/50 bg-primary/5' : 'border-border bg-card',
      )
    "
  >
    <button type="button" class="flex w-full items-start gap-2.5 p-3 text-left" @click="emit('select', asset.id)">
      <span
        class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-body font-medium text-white"
        :style="{ backgroundColor: asset.color }"
      >
        {{ asset.name.slice(0, 1) }}
      </span>
      <span class="min-w-0 flex-1">
        <span class="flex flex-wrap items-center gap-1.5">
          <span class="truncate text-body font-medium">{{ asset.name }}</span>
          <Badge>{{ assetKindLabel[asset.kind] }}</Badge>
          <Badge v-if="asset.role">{{ roleLabel[asset.role] }}</Badge>
          <Badge :variant="stable ? 'success' : 'warn'">
            <span class="size-1.5 rounded-full bg-current" />
            {{ stable ? '已锁定' : '未锁定' }}
          </Badge>
        </span>
        <span v-if="asset.summary" class="text-muted-foreground mt-1 block text-meta">
          {{ asset.summary }}
        </span>
        <span class="text-muted-foreground mt-1 line-clamp-2 block text-meta leading-snug">
          {{ asset.prompt }}
        </span>
        <span v-if="asset.voice" class="text-muted-foreground mt-1 block font-mono text-micro">
          {{ voiceLabel[asset.voice] }}
        </span>
      </span>
    </button>

    <div class="border-border grid grid-cols-4 gap-1.5 border-t p-2">
      <div v-for="entry in slots" :key="entry.view" class="space-y-1">
        <div
          :class="
            cn(
              'relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded border text-micro',
              entry.reference
                ? 'border-border'
                : 'border-border border-dashed text-muted-foreground',
            )
          "
          :style="
            entry.reference
              ? {
                  backgroundImage: `linear-gradient(150deg, ${asset.color}3d, ${asset.color}14 60%, transparent)`,
                }
              : undefined
          "
        >
          <Tip v-if="!entry.reference" label="生成参考图">
            <button
              type="button"
              class="hover:text-foreground flex size-full items-center justify-center transition-colors duration-150"
              @click="emit('generate', entry.view)"
            >
              <Sparkles class="size-3.5" />
            </button>
          </Tip>
          <Tip v-else :label="entry.reference.locked ? '解锁' : '锁定为基准'">
            <button
              type="button"
              class="absolute right-1 bottom-1 flex size-5 items-center justify-center rounded bg-black/55 text-white transition-colors duration-150 hover:bg-black/75"
              @click="emit('toggle', entry.reference.id)"
            >
              <Lock v-if="entry.reference.locked" class="size-2.5" />
              <LockOpen v-else class="size-2.5" />
            </button>
          </Tip>
        </div>
        <p class="text-muted-foreground text-center text-micro">{{ viewLabel[entry.view] }}</p>
      </div>
    </div>
  </article>
</template>
