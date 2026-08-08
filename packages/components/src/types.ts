import type { Component } from 'vue'

export type NavEntry<T extends string = string> = {
  path: T
  label: string
  icon: Component
}

export type NavAction = {
  id: string
  label: string
  icon: Component
}

export type RecentEntry = {
  id: string
  title: string
  summary: string
}

export type Account = {
  name: string
  email: string
  initial: string
}

export type Span = {
  text: string
  strong?: boolean
}

export type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; spans: Span[] }
  | { kind: 'divider' }

export type FileNode = {
  name: string
  path: string
  kind: 'dir' | 'file'
  children?: FileNode[]
}

export type Person = {
  id: string
  name: string
  initial: string
  code: string
  tone: string
}

export type Option = {
  id: string
  label: string
  tone?: string
}

export type TaskItem = {
  id: string
  title: string
  priority: string
  assignees: Person[]
  due: string
  subtasks: number
  comments: number
}
