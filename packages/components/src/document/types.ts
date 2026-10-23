import type { Editor } from '@tiptap/core'
import type { Component } from 'vue'

export type Choice = {
  id: string
  label: string
  hint?: string
  group?: string
  icon?: Component
  color?: string
}

export type Command = Choice & {
  shortcut?: string
  danger?: boolean
  run: (editor: Editor) => void
  active?: (editor: Editor) => boolean
  can?: (editor: Editor) => boolean
}
