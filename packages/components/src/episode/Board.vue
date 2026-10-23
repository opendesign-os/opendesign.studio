<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
import type { Asset, Shot } from '@opendesign/models'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@opendesign/shadcn'
import { computed } from 'vue'
import ShotCard from '../shot/ShotCard.vue'

type Group = { scene: string; shots: Shot[]; seconds: number }

const props = defineProps<{ shots: Shot[]; assets: Asset[] }>()
const emit = defineEmits<{ open: [id: string] }>()

const groups = computed(() =>
  props.shots.reduce<Group[]>((list, shot) => {
    const last = list.at(-1)
    if (last?.scene === shot.scene) {
      last.shots.push(shot)
      last.seconds += shot.duration
    } else {
      list.push({ scene: shot.scene, shots: [shot], seconds: shot.duration })
    }
    return list
  }, []),
)
</script>

<template>
  <div class="space-y-5">
    <Collapsible v-for="(group, index) in groups" :key="`${group.scene}-${index}`" default-open>
      <CollapsibleTrigger class="group flex w-full items-center gap-2 text-left">
        <ChevronDown
          class="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-data-[state=closed]:-rotate-90"
        />
        <h3 class="text-data font-semibold">{{ group.scene }}</h3>
        <span class="text-muted-foreground text-meta tabular-nums">
          {{ group.shots.length }} 镜 · {{ group.seconds.toFixed(1) }}s
        </span>
        <span class="bg-border h-px flex-1" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(min(15rem,100%),1fr))] gap-3 pt-3">
          <div
            v-for="shot in group.shots"
            :key="shot.id"
            role="link"
            tabindex="0"
            :aria-label="`镜 ${shot.index}`"
            class="focus-visible:ring-ring/50 cursor-pointer rounded-xl outline-none focus-visible:ring-3"
            @click="emit('open', shot.id)"
            @keydown.enter="emit('open', shot.id)"
          >
            <ShotCard :shot="shot" :assets="assets" :selected="false" :dim="false" />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>

    <p v-if="!groups.length" class="text-muted-foreground py-16 text-center text-data">
      没有符合条件的镜头
    </p>
  </div>
</template>
