<script setup lang="ts">
import { ArrowUp, ChevronDown, Globe, Mic, Paperclip, Plus } from '@lucide/vue'
import { Button, Textarea } from '@opendesign/shadcn'
import { ref } from 'vue'

defineProps<{ placeholder: string; model: string }>()

const emit = defineEmits<{ submit: [text: string] }>()

const draft = ref('')

function send() {
  const text = draft.value.trim()
  if (!text) return
  emit('submit', text)
  draft.value = ''
}
</script>

<template>
  <div class="border-border/70 bg-card/90 rounded-2xl border p-3 shadow-sm backdrop-blur-sm">
    <Textarea
      v-model="draft"
      :placeholder="placeholder"
      class="text-foreground placeholder:text-muted-foreground max-h-40 min-h-11 resize-none border-0 bg-transparent px-2 py-1.5 text-[0.9375rem] shadow-none focus-visible:ring-0"
      @keydown.enter.exact.prevent="send"
    />

    <div class="mt-1 flex items-center gap-0.5">
      <Button variant="ghost" size="icon" class="text-muted-foreground size-8 rounded-lg">
        <Plus class="size-[1.15rem]" />
      </Button>
      <Button variant="ghost" size="icon" class="text-muted-foreground size-8 rounded-lg">
        <Paperclip class="size-[1.15rem]" />
      </Button>
      <Button variant="ghost" size="icon" class="text-muted-foreground size-8 rounded-lg">
        <Globe class="size-[1.15rem]" />
      </Button>
      <Button variant="ghost" size="icon" class="text-muted-foreground size-8 rounded-lg">
        <Mic class="size-[1.15rem]" />
      </Button>

      <div class="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" class="text-muted-foreground h-8 gap-1 px-2 text-sm">
          {{ model }}
          <ChevronDown class="size-3.5" />
        </Button>
        <Button
          size="icon"
          class="bg-muted text-muted-foreground hover:bg-accent size-8 rounded-full shadow-none"
          :class="draft.trim() && 'bg-primary text-primary-foreground hover:bg-primary/90'"
          @click="send"
        >
          <ArrowUp class="size-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
