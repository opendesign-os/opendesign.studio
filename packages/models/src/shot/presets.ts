import { foleyLabel } from './labels'
import type { Camera, EffectStyle, FoleyKind, Frame } from './schema'
import { foleyKind } from './schema'

export const moves: Record<Camera, { from: Frame; to: Frame }> = {
  static: { from: { x: 0, y: 0, scale: 1 }, to: { x: 0, y: 0, scale: 1 } },
  push: { from: { x: 0, y: 0, scale: 1 }, to: { x: 0, y: 0, scale: 1.35 } },
  pull: { from: { x: 0, y: 0, scale: 1.35 }, to: { x: 0, y: 0, scale: 1 } },
  pan: { from: { x: -12, y: 0, scale: 1.2 }, to: { x: 12, y: 0, scale: 1.2 } },
  tilt: { from: { x: 0, y: -12, scale: 1.2 }, to: { x: 0, y: 12, scale: 1.2 } },
  orbit: { from: { x: -8, y: -4, scale: 1.25 }, to: { x: 8, y: 4, scale: 1.15 } },
  shake: { from: { x: -2, y: 1, scale: 1.1 }, to: { x: 2, y: -1, scale: 1.1 } },
}

export const onomatopoeia: Record<EffectStyle, string> = {
  impact: '咚！',
  soft: '沙沙',
  speed: '嗖——',
  glow: '叮',
}

const lengths: Record<FoleyKind, number> = {
  rain: 4,
  wind: 3,
  crowd: 3.5,
  train: 3,
  fire: 3,
  water: 2.5,
  footsteps: 1.6,
  heartbeat: 2,
  door: 0.8,
  glass: 1.2,
  bell: 2.4,
  rumble: 2,
}

export const foley = foleyKind.options.map((kind) => ({
  kind,
  name: foleyLabel[kind],
  duration: lengths[kind],
}))
