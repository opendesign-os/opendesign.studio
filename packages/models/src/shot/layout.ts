import type { Point, Shot } from './schema'

export function arrange(items: Pick<Shot, 'id' | 'index' | 'scene'>[]) {
  const spots = new Map<string, Point>()
  let row = -1
  let column = 0
  let scene = ''
  for (const item of [...items].sort((a, b) => a.index - b.index)) {
    if (item.scene !== scene) {
      row += 1
      column = 0
      scene = item.scene
    }
    spots.set(item.id, { x: column * 304, y: row * 340 })
    column += 1
  }
  return spots
}
