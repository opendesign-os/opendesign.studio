import { z } from 'zod'

export const protocol = z.enum([
  'anthropic',
  'openai',
  'compatible',
  'bytedance',
  'klingai',
  'alibaba',
])

export const preset = z.enum([
  'anthropic',
  'openai',
  'deepseek',
  'minimax',
  'moonshot',
  'zhipu',
  'bytedance',
  'alibaba',
  'klingai',
  'siliconflow',
])

export const vendor = z.object({
  id: z.string(),
  preset: preset.optional(),
  name: z.string().trim().min(1, '名称不能为空').max(40, '名称最多 40 个字'),
  protocol,
  endpoint: z.union([
    z.url({ protocol: /^https?$/, error: '服务地址要以 http:// 或 https:// 开头' }),
    z.literal(''),
  ]),
  key: z.string().trim(),
})

export const vendorDraft = vendor.omit({ id: true })
export const vendorPatch = vendorDraft.omit({ preset: true }).partial()

export const model = z.object({ id: z.string(), name: z.string().optional() })

export type Protocol = z.infer<typeof protocol>
export type Preset = z.infer<typeof preset>
export type Vendor = z.infer<typeof vendor>
export type VendorDraft = z.infer<typeof vendorDraft>
export type VendorPatch = z.infer<typeof vendorPatch>
export type Model = z.infer<typeof model>
