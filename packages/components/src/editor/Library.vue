<script setup lang="ts">
import { Check, Lock } from '@lucide/vue'
import type { Asset } from '@opendesign/models'
import { assetKindLabel, assetKinds, locked } from '@opendesign/models'
import { cn } from '@opendesign/shadcn'
import { computed } from 'vue'

const props = defineProps<{ assets: Asset[]; cast: string[] }>()
const emit = defineEmits<{ toggle: [id: string] }>()

const groups = computed(() =>
  assetKinds
    .map((kind) => ({ kind, items: props.assets.filter((item) => item.kind === kind) }))
    .filter((group) => group.items.length > 0),
)
</script>

<template>
  <div class="space-y-4 p-3">
    <p class="text-muted-foreground text-meta leading-relaxed">
      点选即绑定到当前镜头，提示词里用 @名称 引用
    </p>
    <section v-for="group in groups" :key="group.kind">
      <h3 class="text-muted-foreground mb-2 flex items-center gap-1.5 text-meta font-medium">
        {{ assetKindLabel[group.kind] }}
        <span class="font-mono tabular-nums opacity-70">{{ group.items.length }}</span>
      </h3>
      <ul class="grid grid-cols-[repeat(auto-fill,minmax(min(4.5rem,100%),1fr))] gap-2">
        <li v-for="item in group.items" :key="item.id">
          <button
            type="button"
            :aria-pressed="cast.includes(item.id)"
            class="group w-full text-left"
            @click="emit('toggle', item.id)"
          >
            <span
              :class="
                cn(
                  'relative flex aspect-square items-center justify-center rounded-lg text-lg font-semibold text-white ring-offset-2 ring-offset-card transition-shadow duration-150',
                  cast.includes(item.id) ? 'ring-selection ring-2' : 'group-hover:ring-border group-hover:ring-2',
                )
              "
              :style="{
                backgroundImage: `linear-gradient(150deg, ${item.color}, color-mix(in oklab, ${item.color} 55%, black))`,
              }"
            >
              {{ item.name.slice(0, 1) }}
              <span
                v-if="cast.includes(item.id)"
                class="bg-selection absolute top-1 right-1 flex size-4 items-center justify-center rounded-full"
              >
                <Check class="size-2.5" />
              </span>
              <Lock v-if="locked(item)" class="absolute bottom-1 left-1 size-3 opacity-85" />
            </span>
            <span class="mt-1 block truncate text-meta">{{ item.name }}</span>
            <span v-if="!locked(item)" class="text-container block text-micro">参考图未锁</span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
