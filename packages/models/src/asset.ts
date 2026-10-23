import { z } from 'zod'

export const assetKind = z.enum(['character', 'scene', 'prop', 'costume'])

export const role = z.enum(['lead', 'support', 'extra'])

export const voice = z.enum(['warm-male', 'bright-female', 'low-male', 'soft-female', 'narrator'])

export const view = z.enum(['front', 'side', 'back', 'closeup'])

export const reference = z.object({
  id: z.string(),
  view,
  locked: z.boolean(),
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
export type AssetPatch = Partial<Omit<Asset, 'id' | 'seriesId'>>
export type Candidate = z.infer<typeof candidate>

export const assetKindLabel: Record<AssetKind, string> = {
  character: '角色',
  scene: '场景',
  prop: '道具',
  costume: '服装',
}

export const assetKinds: AssetKind[] = ['character', 'scene', 'prop', 'costume']

export const roleLabel: Record<Role, string> = {
  lead: '主角',
  support: '配角',
  extra: '龙套',
}

export const voiceLabel: Record<Voice, string> = {
  'warm-male': '温润男声',
  'bright-female': '清亮女声',
  'low-male': '低沉男声',
  'soft-female': '柔和女声',
  narrator: '旁白',
}

export const viewLabel: Record<View, string> = {
  front: '正面',
  side: '侧面',
  back: '背面',
  closeup: '特写',
}

export const views: View[] = ['front', 'side', 'back', 'closeup']

export function locked(item: Asset) {
  return item.references.some((entry) => entry.locked)
}
