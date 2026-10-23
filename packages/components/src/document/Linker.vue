<script setup lang="ts">
import { Link, Unlink } from '@lucide/vue'
import {
  Button,
  cn,
  Input,
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@opendesign/shadcn'
import type { Editor } from '@tiptap/core'
import { ref } from 'vue'
import Tip from '../layout/Tip.vue'

const props = defineProps<{ editor: Editor }>()

const open = ref(false)
const url = ref('')

function show(value: boolean) {
  open.value = value
  if (value) url.value = (props.editor.getAttributes('link').href as string | undefined) ?? ''
}

function apply() {
  const href = url.value.trim()
  const chain = props.editor.chain().focus().extendMarkRange('link')
  if (href) chain.setLink({ href }).run()
  else chain.unsetLink().run()
  open.value = false
}

function clear() {
  props.editor.chain().focus().extendMarkRange('link').unsetLink().run()
  open.value = false
}
</script>

<template>
  <Popover :open="open" @update:open="show">
    <PopoverAnchor as-child>
      <span class="inline-flex">
        <Tip label="链接">
          <PopoverTrigger as-child>
            <Button
              variant="ghost"
              size="icon-sm"
              :class="cn(editor.isActive('link') && 'bg-accent text-foreground')"
              :aria-pressed="editor.isActive('link')"
            >
              <Link />
            </Button>
          </PopoverTrigger>
        </Tip>
      </span>
    </PopoverAnchor>
    <PopoverContent align="start" class="flex w-80 items-center gap-1.5 p-2">
      <Input v-model="url" placeholder="粘贴链接，回车确认" class="flex-1" @keydown.enter.prevent="apply" />
      <Tip label="移除链接">
        <Button variant="ghost" size="icon-sm" :disabled="!editor.isActive('link')" @click="clear">
          <Unlink />
        </Button>
      </Tip>
    </PopoverContent>
  </Popover>
</template>
