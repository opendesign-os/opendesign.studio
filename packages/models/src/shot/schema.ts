import { z } from 'zod'

export const MIN_DURATION = 0.5
export const MAX_DURATION = 30

export const shotSize = z.enum(['wide', 'medium', 'close', 'macro'])

export const camera = z.enum(['static', 'push', 'pull', 'pan', 'tilt', 'orbit', 'shake'])

export const easing = z.enum(['linear', 'in', 'out', 'inout'])

export const shotStatus = z.enum([
  'draft',
  'keyframe',
  'generating',
  'review',
  'composed',
  'failed',
])

export const emotion = z.enum(['calm', 'happy', 'angry', 'sad', 'tense', 'whisper'])

export const transition = z.enum(['cut', 'fade', 'wipe', 'flash', 'slide'])

export const plane = z.enum(['back', 'mid', 'fore'])

export const slot = z.enum(['first', 'last'])

export const frame = z.object({
  x: z.number(),
  y: z.number(),
  scale: z.number().min(0.2).max(4),
})

export const point = z.object({
  x: z.number(),
  y: z.number(),
})

export const move = z.object({
  kind: camera,
  from: frame,
  to: frame,
  easing,
})

export const layer = z.object({
  plane,
  depth: z.number().min(0).max(1),
  hidden: z.boolean(),
})

export const keyframe = z.object({
  slot,
  ready: z.boolean(),
  image: z.string().optional(),
})

export const dialogue = z.object({
  id: z.string(),
  assetId: z.string(),
  line: z.string().min(1, '台词不能为空').max(60, '一句台词最多 60 个字'),
  emotion,
  start: z.number().nonnegative(),
  duration: z.number().positive(),
})

export const shot = z.object({
  id: z.string(),
  episodeId: z.string(),
  scene: z.string(),
  index: z.number().int().positive(),
  size: shotSize,
  move,
  layers: z.array(layer),
  prompt: z.string().min(4, '画面描述至少 4 个字').max(300, '画面描述最多 300 个字'),
  cast: z.array(z.string()),
  keyframes: z.array(keyframe),
  dialogue: z.array(dialogue),
  transition,
  duration: z.number().min(MIN_DURATION).max(MAX_DURATION, `单镜头最长 ${MAX_DURATION} 秒`),
  status: shotStatus,
  note: z.string().max(120, '备注最多 120 个字'),
  position: point,
  video: z.string().optional(),
})

export const shotDraft = shot.pick({
  scene: true,
  size: true,
  prompt: true,
  note: true,
})

export const shotPatch = shot
  .omit({ id: true, episodeId: true, index: true, keyframes: true, video: true })
  .partial()

export type ShotSize = z.infer<typeof shotSize>
export type Camera = z.infer<typeof camera>
export type Easing = z.infer<typeof easing>
export type ShotStatus = z.infer<typeof shotStatus>
export type Emotion = z.infer<typeof emotion>
export type Transition = z.infer<typeof transition>
export type Plane = z.infer<typeof plane>
export type Slot = z.infer<typeof slot>
export type Frame = z.infer<typeof frame>
export type Point = z.infer<typeof point>
export type Move = z.infer<typeof move>
export type Layer = z.infer<typeof layer>
export type Keyframe = z.infer<typeof keyframe>
export type Dialogue = z.infer<typeof dialogue>
export type Shot = z.infer<typeof shot>
export type ShotDraft = z.infer<typeof shotDraft>
export type ShotPatch = z.infer<typeof shotPatch>
