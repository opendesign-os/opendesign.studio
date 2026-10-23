import { z } from 'zod'

export const relationKind = z.enum(['family', 'love', 'friend', 'rival', 'work', 'secret'])

export const relation = z.object({
  id: z.string(),
  seriesId: z.string(),
  from: z.string(),
  to: z.string(),
  kind: relationKind,
  mutual: z.boolean(),
  label: z.string().max(16, '关系最多 16 个字'),
  note: z.string().max(120, '备注最多 120 个字'),
})

export type RelationKind = z.infer<typeof relationKind>
export type Relation = z.infer<typeof relation>
export type RelationDraft = Omit<Relation, 'id' | 'seriesId'>
export type RelationPatch = Partial<Omit<Relation, 'id' | 'seriesId'>>

export const relationKindLabel: Record<RelationKind, string> = {
  family: '亲人',
  love: '恋人',
  friend: '朋友',
  rival: '对手',
  work: '同事',
  secret: '秘密',
}
