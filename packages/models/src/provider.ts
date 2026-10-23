import { z } from 'zod'

export const providerKind = z.enum(['text', 'image', 'video', 'voice'])

export const setting = z.union([z.number(), z.string(), z.boolean()])

export const provider = z.object({
  id: z.string(),
  label: z.string(),
  kind: providerKind,
  models: z.array(z.string()),
  active: z.string(),
  fallback: z.string(),
  endpoint: z.string(),
  key: z.string(),
  connected: z.boolean(),
  concurrency: z.number().int().min(1).max(8),
  retries: z.number().int().min(0).max(3),
  params: z.record(z.string(), setting),
})

export type ProviderKind = z.infer<typeof providerKind>
export type Setting = z.infer<typeof setting>
export type Provider = z.infer<typeof provider>
export type ProviderPatch = Partial<
  Omit<Provider, 'id' | 'label' | 'kind' | 'models' | 'connected'>
>
export type Probe = { ok: boolean; latency: number; message: string }

type Base = { key: string; label: string; hint?: string }

export type Control = Base &
  (
    | { type: 'range'; min: number; max: number; step: number; value: number; unit?: string }
    | { type: 'choice'; options: Record<string, string>; value: string }
    | { type: 'toggle'; value: boolean }
    | { type: 'number'; min: number; max: number; value: number }
  )

export const providerKindLabel: Record<ProviderKind, string> = {
  text: '文本',
  image: '图像',
  video: '视频',
  voice: '语音',
}

export const controls: Record<ProviderKind, Control[]> = {
  text: [
    {
      key: 'temperature',
      label: '创造性',
      hint: '越高越发散，拆解分镜建议 0.5–0.8',
      type: 'range',
      min: 0,
      max: 1.5,
      step: 0.1,
      value: 0.7,
    },
    {
      key: 'tokens',
      label: '单次输出上限',
      type: 'choice',
      options: { '4096': '4K', '8192': '8K', '16384': '16K', '32768': '32K' },
      value: '8192',
    },
    {
      key: 'grain',
      label: '拆解粒度',
      hint: '每场戏拆成多少个镜头',
      type: 'choice',
      options: { coarse: '粗', standard: '标准', fine: '细' },
      value: 'standard',
    },
  ],
  image: [
    {
      key: 'resolution',
      label: '分辨率',
      type: 'choice',
      options: { '1k': '1K', '2k': '2K', '4k': '4K' },
      value: '2k',
    },
    {
      key: 'count',
      label: '每次出图',
      type: 'range',
      min: 1,
      max: 4,
      step: 1,
      value: 2,
      unit: '张',
    },
    {
      key: 'guidance',
      label: '提示词遵循度',
      hint: '越高越贴合描述，过高会损失画面自然度',
      type: 'range',
      min: 1,
      max: 10,
      step: 0.5,
      value: 6,
    },
    {
      key: 'seed',
      label: '固定种子',
      hint: '0 为随机，固定后便于复现',
      type: 'number',
      min: 0,
      max: 2147483647,
      value: 0,
    },
  ],
  video: [
    {
      key: 'resolution',
      label: '分辨率',
      type: 'choice',
      options: { '720p': '720p', '1080p': '1080p' },
      value: '1080p',
    },
    {
      key: 'fps',
      label: '帧率',
      type: 'choice',
      options: { '24': '24 fps', '30': '30 fps' },
      value: '24',
    },
    { key: 'motion', label: '运动幅度', type: 'range', min: 1, max: 10, step: 1, value: 5 },
    {
      key: 'consistency',
      label: '角色一致性',
      hint: '用已锁定的参考图约束人物外观',
      type: 'toggle',
      value: true,
    },
  ],
  voice: [
    {
      key: 'speed',
      label: '语速',
      type: 'range',
      min: 0.5,
      max: 2,
      step: 0.05,
      value: 1,
      unit: '×',
    },
    { key: 'emotion', label: '情绪强度', type: 'range', min: 0, max: 1, step: 0.1, value: 0.6 },
    {
      key: 'rate',
      label: '采样率',
      type: 'choice',
      options: { '24000': '24 kHz', '44100': '44.1 kHz', '48000': '48 kHz' },
      value: '44100',
    },
  ],
}

export const schedule = { concurrency: 4, retries: 2 }

export const pacing: Control[] = [
  {
    key: 'concurrency',
    label: '并发上限',
    hint: '同时进行的生成任务数',
    type: 'range',
    min: 1,
    max: 8,
    step: 1,
    value: schedule.concurrency,
  },
  {
    key: 'retries',
    label: '失败重试',
    hint: '失败后自动重试，仍失败再切到备用模型',
    type: 'range',
    min: 0,
    max: 3,
    step: 1,
    value: schedule.retries,
    unit: ' 次',
  },
]

export function defaults(kind: ProviderKind): Record<string, Setting> {
  return Object.fromEntries(controls[kind].map((item) => [item.key, item.value]))
}
