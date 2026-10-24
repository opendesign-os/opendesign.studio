import { tenth } from '@opendesign/common'
import { interpolate } from './motion'
import type { Shot } from './schema'

export type Placement = {
  shot: Shot
  start: number
  end: number
}

export function sequence(shots: Shot[]): Placement[] {
  let cursor = 0
  return [...shots]
    .sort((a, b) => a.index - b.index)
    .map((shot) => {
      const start = cursor
      cursor += shot.duration
      return { shot, start, end: cursor }
    })
}

export function locate(placements: Placement[], time: number) {
  return placements.find((item) => time >= item.start && time < item.end) ?? placements.at(-1)
}

export function split(item: Shot, at: number, id: string): [Shot, Shot] {
  const middle = interpolate(item.move, at, item.duration)
  const frame = {
    x: tenth(middle.x),
    y: tenth(middle.y),
    scale: Math.round(middle.scale * 100) / 100,
  }
  const head = <T extends { start: number; duration: number }>(list: T[]) =>
    list
      .filter((entry) => entry.start < at)
      .map((entry) => ({ ...entry, duration: Math.min(entry.duration, tenth(at - entry.start)) }))
  const tail = <T extends { start: number }>(list: T[]) =>
    list
      .filter((entry) => entry.start >= at)
      .map((entry) => ({ ...entry, start: tenth(entry.start - at) }))

  return [
    {
      ...item,
      move: { ...item.move, to: frame },
      keyframes: item.keyframes.map((entry) =>
        entry.slot === 'last' ? { ...entry, ready: false } : entry,
      ),
      dialogue: head(item.dialogue),
      duration: at,
    },
    {
      ...item,
      id,
      index: item.index + 1,
      move: { ...item.move, from: frame },
      keyframes: item.keyframes.map((entry) => ({ ...entry, ready: false })),
      dialogue: tail(item.dialogue),
      transition: 'cut',
      duration: tenth(item.duration - at),
      status: 'draft',
      note: '',
      position: { x: item.position.x + 48, y: item.position.y + 48 },
    },
  ]
}
