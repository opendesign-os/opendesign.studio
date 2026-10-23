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

export const relationDraft = relation.omit({ id: true, seriesId: true })

export const relationPatch = relationDraft.partial()

export type RelationKind = z.infer<typeof relationKind>
export type Relation = z.infer<typeof relation>
export type RelationDraft = z.infer<typeof relationDraft>
export type RelationPatch = z.infer<typeof relationPatch>
