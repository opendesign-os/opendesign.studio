import type { Aspect, Protocol, Setting } from '@opendesign/models'
import { formats } from '@opendesign/models'

const scales: Record<string, number> = { '1K': 0.75, '2K': 1, '4K': 1.4 }

function dimension(value: number, scale: number) {
  return Math.round((value * scale) / 16) * 16
}

export function canvas(protocol: Protocol, aspect: Aspect, resolution: Setting | undefined) {
  const { width, height } = formats[aspect]
  if (protocol === 'openai') {
    if (width === height) return { size: '1024x1024' as const }
    return { size: width > height ? ('1536x1024' as const) : ('1024x1536' as const) }
  }
  const scale = scales[String(resolution)] ?? 1
  return {
    size: `${dimension(width, scale)}x${dimension(height, scale)}` as const,
    providerOptions: { bytedance: { watermark: false } },
  }
}

export function frame(aspect: Aspect, quality: Setting | undefined) {
  const { width, height } = formats[aspect]
  const scale = quality === '720p' ? 2 / 3 : 1
  return `${dimension(width, scale)}x${dimension(height, scale)}` as const
}
