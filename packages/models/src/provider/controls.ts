import type { Control, ProviderKind, Setting } from './schema'

export const controls: Record<ProviderKind, Control[]> = {
  text: [
    {
      key: 'temperature',
      label: '创造性',
      hint: '越高越发散，拆解分镜建议 0.5–0.8；Claude 模型不使用此项',
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
      hint: '按画幅与档位换算像素；OpenAI 取最接近的固定尺寸，MiniMax 最长边不超过 2048',
      type: 'choice',
      options: { '1K': '1K', '2K': '2K', '4K': '4K' },
      value: '2K',
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
