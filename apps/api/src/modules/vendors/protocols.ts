import { createAlibaba } from '@ai-sdk/alibaba'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createByteDance } from '@ai-sdk/bytedance'
import { createKlingAI } from '@ai-sdk/klingai'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { Model, Protocol, Vendor } from '@opendesign/models'
import { protocolLabel } from '@opendesign/models'
import { FetchError, ofetch } from 'ofetch'
import { z } from 'zod'
import * as minimax from './minimax'

export type Access = Pick<Vendor, 'protocol' | 'endpoint' | 'key'>

const listing = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      display_name: z.string().optional(),
      name: z.string().optional(),
    }),
  ),
})

function unsupported(access: Access, ability: string): never {
  throw new Error(`${protocolLabel[access.protocol]}接口不支持${ability}`)
}

const paths: Partial<Record<Protocol, string>> = {
  alibaba: '/compatible-mode/v1',
  minimax: '/anthropic/v1',
}

function base(access: Access) {
  return `${access.endpoint.replace(/\/+$/, '')}${paths[access.protocol] ?? ''}`
}

function options(access: Access) {
  return { apiKey: access.key, baseURL: base(access) }
}

function compatible(access: Access) {
  return createOpenAICompatible({ ...options(access), name: access.protocol })
}

export function language(access: Access, model: string) {
  if (access.protocol === 'anthropic' || access.protocol === 'minimax') {
    return createAnthropic(options(access)).languageModel(model)
  }
  if (access.protocol === 'openai') return createOpenAI(options(access)).languageModel(model)
  if (access.protocol === 'alibaba') return createAlibaba(options(access)).languageModel(model)
  if (access.protocol === 'compatible' || access.protocol === 'bytedance') {
    return compatible(access).chatModel(model)
  }
  return unsupported(access, '文本生成')
}

export function image(access: Access, model: string) {
  if (access.protocol === 'bytedance') return createByteDance(options(access)).imageModel(model)
  if (access.protocol === 'openai') return createOpenAI(options(access)).imageModel(model)
  if (access.protocol === 'compatible') return compatible(access).imageModel(model)
  if (access.protocol === 'minimax') return minimax.image(access, model)
  return unsupported(access, '图像生成')
}

export function video(access: Access, model: string) {
  if (access.protocol === 'klingai') return createKlingAI(options(access)).videoModel(model)
  if (access.protocol === 'bytedance') return createByteDance(options(access)).videoModel(model)
  if (access.protocol === 'alibaba') {
    return createAlibaba({ apiKey: access.key, videoBaseURL: access.endpoint }).videoModel(model)
  }
  if (access.protocol === 'minimax') return minimax.video(access, model)
  return unsupported(access, '视频生成')
}

export function duration(protocol: Protocol, seconds: number) {
  if (protocol === 'minimax') return Math.min(15, Math.max(4, Math.round(seconds)))
  return seconds <= 5 ? 5 : 10
}

export async function download({ url, abortSignal }: { url: URL; abortSignal?: AbortSignal }) {
  const response = await fetch(url, { signal: abortSignal })
  if (!response.ok) throw new Error(`下载厂商生成的文件失败（HTTP ${response.status}）`)
  return {
    data: new Uint8Array(await response.arrayBuffer()),
    mediaType: response.headers.get('content-type') ?? undefined,
  }
}

export async function catalog(access: Access): Promise<Model[]> {
  if (access.protocol === 'klingai') return []
  const anthropic = access.protocol === 'anthropic' || access.protocol === 'minimax'
  const body = await ofetch(`${base(access)}/models`, {
    headers: anthropic
      ? { 'x-api-key': access.key, 'anthropic-version': '2023-06-01' }
      : { authorization: `Bearer ${access.key}` },
    query: anthropic ? { limit: 1000 } : undefined,
    timeout: 15_000,
  }).catch((error: unknown) => {
    if (error instanceof FetchError && error.status === 404) return { data: [] }
    throw error
  })
  const kind = access.protocol === 'minimax' ? ('text' as const) : undefined
  return listing
    .parse(body)
    .data.map((item) => ({ id: item.id, name: item.display_name ?? item.name, kind }))
}
