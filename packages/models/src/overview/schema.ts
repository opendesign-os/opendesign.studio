import { z } from 'zod'

export const overview = z.object({
  series: z.number().int(),
  producing: z.number().int(),
  shots: z.number().int(),
  blocked: z.number().int(),
  review: z.number().int(),
  running: z.number().int(),
  failed: z.number().int(),
  assets: z.number().int(),
  loose: z.number().int(),
})

export type Overview = z.infer<typeof overview>
