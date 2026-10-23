<script setup lang="ts">
import { Check, Mountain, Package, Shirt, User, X } from '@lucide/vue'
import type { AssetKind, Candidate } from '@opendesign/models'
import { assetKindLabel } from '@opendesign/models'
import type { Component } from 'vue'
import Tip from '../layout/Tip.vue'

defineProps<{ items: Candidate[]; busy: boolean }>()
const emit = defineEmits<{ resolve: [id: string, accept: boolean] }>()

const icons: Record<AssetKind, Component> = {
  character: User,
  scene: Mountain,
  prop: Package,
  costume: Shirt,
}

const action =
  'text-muted-foreground flex size-7 items-center justify-center rounded-md transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4'
</script>

<template>
  <div class="p-2">
    <article
      v-for="item in items"
      :key="item.id"
      class="group hover:bg-accent/60 flex gap-2.5 rounded-lg px-2.5 py-2.5 transition-colors duration-150"
    >
      <component :is="icons[item.kind]" class="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <p class="text-data min-w-0 flex-1 truncate font-medium">{{ item.name }}</p>
          <Tip label="收进资产库">
            <button
              type="button"
              :class="[action, 'hover:bg-success/10 hover:text-success']"
              :disabled="busy"
              @click="emit('resolve', item.id, true)"
            >
              <Check />
            </button>
          </Tip>
          <Tip label="忽略">
            <button
              type="button"
              :class="[action, 'hover:bg-destructive/10 hover:text-destructive']"
              :disabled="busy"
              @click="emit('resolve', item.id, false)"
            >
              <X />
            </button>
          </Tip>
        </div>
        <p class="text-muted-foreground text-micro">
          {{ assetKindLabel[item.kind] }} · 提及 {{ item.mentions }} 次
        </p>
        <p class="text-muted-foreground mt-1 line-clamp-2 text-meta leading-relaxed">{{ item.prompt }}</p>
      </div>
    </article>

    <p v-if="!items.length" class="text-muted-foreground px-4 py-12 text-center text-data leading-relaxed">
      没有待确认的候选资产<br />
      <span class="text-meta">拆解分镜后，剧本里新出现的角色、场景、道具会列在这里</span>
    </p>
  </div>
</template>
