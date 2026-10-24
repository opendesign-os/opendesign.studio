import type { ProviderKind } from '../provider/schema'
import type { Preset, Protocol, VendorDraft } from './schema'

type Template = {
  name: string
  protocol: Protocol
  endpoint: string
  models: Partial<Record<ProviderKind, string[]>>
}

export const presets: Record<Preset, Template> = {
  anthropic: {
    name: 'Anthropic',
    protocol: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1',
    models: { text: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'] },
  },
  openai: {
    name: 'OpenAI',
    protocol: 'openai',
    endpoint: 'https://api.openai.com/v1',
    models: {
      text: ['gpt-6.1-sol', 'gpt-5.5', 'gpt-5.4-mini'],
      image: ['gpt-image-2.5-flare', 'gpt-image-2', 'gpt-image-1.5'],
    },
  },
  deepseek: {
    name: 'DeepSeek',
    protocol: 'compatible',
    endpoint: 'https://api.deepseek.com/v1',
    models: { text: [] },
  },
  minimax: {
    name: 'MiniMax',
    protocol: 'minimax',
    endpoint: 'https://api.minimax.cn',
    models: {
      text: ['MiniMax-M3', 'MiniMax-M3.1-Flash'],
      image: ['image-01', 'image-01-live'],
      video: ['MiniMax-H3', 'MiniMax-H3-Max', 'MiniMax-H3-Highspeed', 'MiniMax-H3-Lite'],
    },
  },
  moonshot: {
    name: '月之暗面',
    protocol: 'compatible',
    endpoint: 'https://api.moonshot.cn/v1',
    models: { text: [] },
  },
  zhipu: {
    name: '智谱',
    protocol: 'compatible',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4',
    models: { text: [] },
  },
  bytedance: {
    name: '火山方舟',
    protocol: 'bytedance',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3',
    models: {
      text: [],
      image: [
        'doubao-seedream-5-0-pro-260628',
        'doubao-seedream-5-0-260128',
        'doubao-seedream-4-5-251128',
        'doubao-seedream-4-0-250828',
      ],
      video: [
        'doubao-seedance-2-0-260128',
        'doubao-seedance-2-0-fast-260128',
        'doubao-seedance-2-5-260628',
      ],
    },
  },
  alibaba: {
    name: '阿里云百炼',
    protocol: 'alibaba',
    endpoint: 'https://dashscope.aliyuncs.com',
    models: {
      text: ['qwen3.7-max', 'qwen-plus', 'qwen-flash'],
      video: ['wan2.6-i2v', 'wan2.6-i2v-flash', 'wan3.0-video'],
    },
  },
  klingai: {
    name: '可灵',
    protocol: 'klingai',
    endpoint: 'https://api-beijing.klingai.com',
    models: { video: ['kling-v3.0-i2v', 'kling-v2.6-i2v', 'kling-v2.5-turbo-i2v'] },
  },
  siliconflow: {
    name: '硅基流动',
    protocol: 'compatible',
    endpoint: 'https://api.siliconflow.cn/v1',
    models: { text: [], image: [] },
  },
}

export const abilities: Record<Protocol, ProviderKind[]> = {
  anthropic: ['text'],
  openai: ['text', 'image'],
  compatible: ['text', 'image'],
  bytedance: ['text', 'image', 'video'],
  klingai: ['video'],
  alibaba: ['text', 'video'],
  minimax: ['text', 'image', 'video'],
}

type Source = { preset?: Preset | null; protocol: Protocol }

export function supports(source: Source, kind: ProviderKind) {
  return source.preset
    ? kind in presets[source.preset].models
    : abilities[source.protocol].includes(kind)
}

export function suggestions(source: Source, kind: ProviderKind) {
  return (source.preset && presets[source.preset].models[kind]) || []
}

export function draft(name?: Preset): VendorDraft {
  if (!name) return { name: '自定义厂商', protocol: 'compatible', endpoint: '', key: '' }
  const { protocol, endpoint } = presets[name]
  return { preset: name, name: presets[name].name, protocol, endpoint, key: '' }
}
