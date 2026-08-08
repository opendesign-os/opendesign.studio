import type { Component } from 'vue'

export type NavEntry<T extends string = string> = {
  path: T
  label: string
  icon: Component
}
