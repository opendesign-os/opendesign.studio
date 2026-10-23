import { z } from 'zod'

export const assetKind = z.enum(['character', 'scene', 'prop', 'costume'])

export const role = z.enum(['lead', 'support', 'extra'])

export const voice = z.enum(['warm-male', 'bright-female', 'low-male', 'soft-female', 'narrator'])

export const view = z.enum(['front', 'side', 'back', 'closeup'])

export const reference = z.object({
  id: z.string(),
  view,
  locked: z.boolean(),
  image: z.string().optional(),
})

export const asset = z.object({
  id: z.string(),
  seriesId: z.string(),
  kind: assetKind,
  name: z.string().min(1, '名称不能为空').max(12, '名称最多 12 个字'),
  summary: z.string().max(24, '一句话最多 24 个字'),
  prompt: z.string().min(4, '描述至少 4 个字').max(240, '描述最多 240 个字'),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, '需要是 #rrggbb 格式'),
  references: z.array(reference),
  role: role.optional(),
  voice: voice.optional(),
})

export const assetDraft = asset.omit({ id: true, seriesId: true, references: true })

export const assetPatch = asset.omit({ id: true, seriesId: true }).partial()

export const candidate = z.object({
  id: z.string(),
  episodeId: z.string(),
  kind: assetKind,
  name: z.string(),
  prompt: z.string(),
  mentions: z.number().int().nonnegative(),
})

export type AssetKind = z.infer<typeof assetKind>
export type Role = z.infer<typeof role>
export type Voice = z.infer<typeof voice>
export type View = z.infer<typeof view>
export type Reference = z.infer<typeof reference>
export type Asset = z.infer<typeof asset>
export type AssetDraft = z.infer<typeof assetDraft>
export type AssetPatch = z.infer<typeof assetPatch>
export type Candidate = z.infer<typeof candidate>

export function locked(item: Asset) {
  return item.references.some((entry) => entry.locked)
}
