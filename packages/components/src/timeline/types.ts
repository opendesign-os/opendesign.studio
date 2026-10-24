import type { Component } from 'vue'
import type { Tone } from '../common/tone'

export type Span = {
  start: number
  duration: number
}

export type Clip = {
  id: string
  name: string
  kind: 'film' | 'audio'
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
