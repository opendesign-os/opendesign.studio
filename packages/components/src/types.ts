import type { Component } from 'vue'

export type Tone = 'neutral' | 'accent' | 'info' | 'success' | 'warn' | 'danger'

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

export type Span = {
  start: number
  duration: number
}

export type Clip = {
  id: string
  name: string
  kind: 'film' | 'text' | 'effect' | 'audio'
  start: number
  duration: number
  badge?: string
  cover?: string
  tone?: Tone
  audio?: Span[]
}

export type Mark = {
  id: string
  at: number
  label: string
  muted?: boolean
}

export type Track = {
  id: string
  label: string
  kind: Clip['kind']
  icon?: Component
  hidden?: boolean
  locked?: boolean
  sequential?: boolean
  clips: Clip[]
  marks?: Mark[]
}
