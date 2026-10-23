import type { Component } from 'vue'

export type Destination = {
  id: string
  label: string
  icon: Component
  group?: string
}

export type Action = {
  id: string
  label: string
  group: string
  hint?: string
  icon?: Component
  run: () => void
}
