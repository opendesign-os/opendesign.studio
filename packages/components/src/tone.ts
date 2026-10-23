import type { RelationKind, ShotStatus } from '@opendesign/models'
import type { Tone } from './types'

export const fills: Record<Tone, string> = {
  neutral: 'bg-muted-foreground',
  accent: 'bg-primary',
  info: 'bg-media',
  success: 'bg-success',
  warn: 'bg-container',
  danger: 'bg-destructive',
}

export const statusTone: Record<ShotStatus, Tone> = {
  draft: 'neutral',
  keyframe: 'neutral',
  generating: 'info',
  review: 'warn',
  voiced: 'accent',
  composed: 'success',
  failed: 'danger',
}

export const relationColor: Record<RelationKind, string> = {
  family: 'var(--success)',
  love: 'oklch(0.66 0.2 10)',
  friend: 'var(--selection)',
  rival: 'var(--container)',
  work: 'var(--muted-foreground)',
  secret: 'var(--primary)',
}
