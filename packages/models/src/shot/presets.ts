import type { Camera, Frame } from './schema'

export const moves: Record<Camera, { from: Frame; to: Frame }> = {
  static: { from: { x: 0, y: 0, scale: 1 }, to: { x: 0, y: 0, scale: 1 } },
  push: { from: { x: 0, y: 0, scale: 1 }, to: { x: 0, y: 0, scale: 1.35 } },
  pull: { from: { x: 0, y: 0, scale: 1.35 }, to: { x: 0, y: 0, scale: 1 } },
  pan: { from: { x: -12, y: 0, scale: 1.2 }, to: { x: 12, y: 0, scale: 1.2 } },
  tilt: { from: { x: 0, y: -12, scale: 1.2 }, to: { x: 0, y: 12, scale: 1.2 } },
  orbit: { from: { x: -8, y: -4, scale: 1.25 }, to: { x: 8, y: 4, scale: 1.15 } },
  shake: { from: { x: -2, y: 1, scale: 1.1 }, to: { x: 2, y: -1, scale: 1.1 } },
}
