import type { Easing, Frame, Move } from './schema'

const curves: Record<Easing, (t: number) => number> = {
  linear: (t) => t,
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  inout: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
}

function progress(value: Move, time: number, duration: number) {
  const raw = duration > 0 ? Math.min(1, Math.max(0, time / duration)) : 0
  return curves[value.easing](raw)
}

export function interpolate(value: Move, time: number, duration: number, depth = 1): Frame {
  const t = progress(value, time, duration)
  const { from, to } = value
  return {
    x: from.x + (to.x - from.x) * t * depth,
    y: from.y + (to.y - from.y) * t * depth,
    scale: from.scale + (to.scale - from.scale) * t * depth,
  }
}

export function hasMotion(value: Move) {
  const { from, to } = value
  return from.x !== to.x || from.y !== to.y || from.scale !== to.scale
}
