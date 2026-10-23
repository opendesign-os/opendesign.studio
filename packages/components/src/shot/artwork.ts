import type { Frame, Layer, Shot } from '@opendesign/models'

function hue(value: string) {
  let total = 0
  for (const char of value) total = (total * 31 + char.charCodeAt(0)) % 360
  return total
}

function paint(layer: Layer, index: number, base: number, deep: boolean) {
  const shift = (base + index * 28) % 360
  const tone = layer.plane === 'back' ? 0 : layer.plane === 'mid' ? 8 : 16
  const light = deep ? 16 + tone : 84 - tone
  const sat = deep ? 42 : 62
  if (layer.plane === 'back') {
    return `radial-gradient(120% 90% at 30% 20%, hsl(${base} ${sat}% ${light + (deep ? 10 : 5)}%), transparent 62%), linear-gradient(165deg, hsl(${base} ${sat - 18}% ${light}%), hsl(${(base + 40) % 360} ${sat - 14}% ${light - (deep ? 6 : -3)}%))`
  }
  if (layer.plane === 'mid') {
    return `radial-gradient(80% 60% at 70% 70%, hsl(${shift} ${sat + 4}% ${light}% / 0.55), transparent 65%)`
  }
  return `radial-gradient(60% 45% at 40% 78%, hsl(${shift} ${sat + 10}% ${light}% / 0.5), transparent 60%)`
}

export function plates(shot: Shot, deep: boolean) {
  const base = hue(shot.prompt)
  return shot.layers.map((layer, index) => ({ layer, image: paint(layer, index, base, deep) }))
}

export function cover(shot: Shot, deep: boolean) {
  return plates(shot, deep)
    .filter((entry) => !entry.layer.hidden)
    .reverse()
    .map((entry) => entry.image)
    .join(', ')
}

export function crop(frame: Frame) {
  const size = 100 / frame.scale
  return {
    left: `${50 + frame.x - size / 2}%`,
    top: `${50 + frame.y - size / 2}%`,
    width: `${size}%`,
    height: `${size}%`,
  }
}
