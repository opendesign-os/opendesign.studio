<script setup lang="ts">
import { Check, ChevronDown } from '@lucide/vue'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Separator,
} from '@opendesign/shadcn'
import type { Editor } from '@tiptap/core'
import { isTextSelection } from '@tiptap/core'
import type { EditorState } from '@tiptap/pm/state'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import { computed } from 'vue'
import Tip from '../layout/Tip.vue'
import { clear, marks } from './commands'
import Linker from './Linker.vue'
import type { Command } from './types'

const props = defineProps<{ editor: Editor; kinds: Command[] }>()

const chosen = computed(() => props.kinds.find((item) => item.active?.(props.editor)))

const tool = 'aria-pressed:bg-accent aria-pressed:text-foreground text-muted-foreground'

function visible({
  editor,
  state,
  from,
  to,
}: {
  editor: Editor
  state: EditorState
  from: number
  to: number
}) {
  return (
    editor.isEditable &&
    isTextSelection(state.selection) &&
    state.doc.textBetween(from, to).length > 0 &&
    !editor.isActive('codeBlock')
  )
}

function refocus(event: Event) {
  event.preventDefault()
  props.editor.commands.focus()
}
</script>

<template>
  <BubbleMenu
    :editor="editor"
    :should-show="visible"
    :options="{ placement: 'top', offset: 8 }"
    class="bg-popover border-border flex items-center gap-0.5 rounded-lg border p-1 shadow-lg"
  >
    <DropdownMenu :modal="false">
      <DropdownMenuTrigger as-child>
        <Button variant="ghost" size="sm" class="text-data h-8 gap-1 px-2 font-normal">
          {{ chosen?.label ?? '正文' }}
          <ChevronDown class="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" class="max-h-80 w-48" @close-auto-focus="refocus">
        <DropdownMenuLabel class="text-muted-foreground text-micro font-normal">转为</DropdownMenuLabel>
        <DropdownMenuItem v-for="item in kinds" :key="item.id" @select="item.run(editor)">
          <component :is="item.icon" />
          <span class="flex-1 truncate">{{ item.label }}</span>
          <Check v-if="item.id === chosen?.id" class="text-primary" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <Separator orientation="vertical" class="mx-0.5 data-[orientation=vertical]:h-4" />
    <Tip v-for="mark in marks" :key="mark.id" :label="mark.label" :shortcut="mark.shortcut">
      <Button variant="ghost" size="icon-sm" :class="tool" :aria-pressed="mark.active?.(editor)" @click="mark.run(editor)">
        <component :is="mark.icon" />
      </Button>
    </Tip>
    <Linker :editor="editor" />
    <Separator orientation="vertical" class="mx-0.5 data-[orientation=vertical]:h-4" />
    <Tip :label="clear.label">
      <Button variant="ghost" size="icon-sm" :class="tool" @click="clear.run(editor)">
        <component :is="clear.icon" />
      </Button>
    </Tip>
  </BubbleMenu>
</template>
