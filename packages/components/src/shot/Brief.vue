<script setup lang="ts">
import { Check, Pencil, X } from '@lucide/vue'
import type { Asset, Shot } from '@opendesign/models'
import { shotSizeLabel, transitionLabel } from '@opendesign/models'
import { Button, Textarea } from '@opendesign/shadcn'
import { computed, ref } from 'vue'
import Tip from '../layout/Tip.vue'
import Prompt from './Prompt.vue'

const props = defineProps<{ shot: Shot; assets: Asset[]; busy: boolean }>()

const emit = defineEmits<{ rewrite: [prompt: string] }>()

const editing = ref(false)
const text = ref('')

const rows = computed(() => [
  { label: '场次', value: props.shot.scene },
  { label: '景别', value: shotSizeLabel[props.shot.size] },
  { label: '时长', value: `${props.shot.duration} 秒` },
  { label: '转场', value: transitionLabel[props.shot.transition] },
])

function open() {
  text.value = props.shot.prompt
  editing.value = true
}

function save() {
  const next = text.value.trim()
  editing.value = false
  if (next && next !== props.shot.prompt) emit('rewrite', next)
}
</script>

<template>
  <dl class="divide-border divide-y">
    <div v-for="row in rows" :key="row.label" class="text-data flex items-baseline gap-3 py-1.5">
      <dt class="text-muted-foreground shrink-0">{{ row.label }}</dt>
      <dd class="min-w-0 flex-1 truncate text-right">{{ row.value }}</dd>
    </div>
  </dl>

  <div class="mt-2 flex items-center gap-1">
    <span class="text-muted-foreground text-micro flex-1">画面描述</span>
    <template v-if="editing">
      <Tip label="放弃修改">
        <Button variant="ghost" size="icon-sm" @click="editing = false">
          <X />
        </Button>
      </Tip>
      <Tip label="保存并重新生成这个镜头">
        <Button variant="ghost" size="icon-sm" :disabled="busy" @click="save">
          <Check />
        </Button>
      </Tip>
    </template>
    <Tip v-else label="改提示词重新生成">
      <Button variant="ghost" size="icon-sm" :disabled="busy" @click="open">
        <Pencil />
      </Button>
    </Tip>
  </div>

  <Textarea v-if="editing" v-model="text" class="text-data min-h-28" autofocus />
  <Prompt v-else class="text-data text-muted-foreground" :prompt="shot.prompt" :assets="assets" />
</template>
