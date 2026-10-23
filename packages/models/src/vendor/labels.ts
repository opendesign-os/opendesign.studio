import type { Protocol } from './schema'

export const protocolLabel: Record<Protocol, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  compatible: 'OpenAI 兼容',
  bytedance: '火山方舟',
  klingai: '可灵',
  alibaba: '阿里云百炼',
}
