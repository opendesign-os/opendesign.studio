import type { EpisodeStatus, RelationKind, SeriesStatus, ShotStatus } from '@opendesign/models'

export type Tone = 'neutral' | 'accent' | 'info' | 'success' | 'warn' | 'danger'

export const fills: Record<Tone, string> = {
  neutral: 'bg-muted-foreground',
  accent: 'bg-primary',
  info: 'bg-media',
  success: 'bg-success',
  warn: 'bg-container',
  danger: 'bg-destructive',
}

export const tones: {
  shot: Record<ShotStatus, Tone>
  episode: Record<EpisodeStatus, Tone>
  series: Record<SeriesStatus, Tone>
} = {
  shot: {
    draft: 'neutral',
    keyframe: 'neutral',
    generating: 'info',
    review: 'warn',
    voiced: 'accent',
    composed: 'success',
    failed: 'danger',
  },
  episode: {
    draft: 'neutral',
    parsing: 'info',
    producing: 'accent',
    review: 'warn',
    done: 'success',
  },
  series: {
    writing: 'neutral',
    producing: 'accent',
    review: 'warn',
    published: 'success',
  },
}

export const relationColor: Record<RelationKind, string> = {
  family: 'var(--success)',
  love: 'oklch(0.66 0.2 10)',
  friend: 'var(--selection)',
  rival: 'var(--container)',
  work: 'var(--muted-foreground)',
  secret: 'var(--primary)',
}
