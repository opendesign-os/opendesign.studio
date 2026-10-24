import { z } from 'zod'

export const providerKind = z.enum(['text', 'image', 'video'])

export const setting = z.union([z.number(), z.string(), z.boolean()])

export const provider = z.object({
  id: z.string(),
  kind: providerKind,
  vendorId: z.uuid().optional(),
  active: z.string().trim(),
  fallback: z.string().trim(),
  concurrency: z.number().int().min(1).max(8),
  retries: z.number().int().min(0).max(3),
  params: z.record(z.string(), setting),
})

export const providerPatch = provider.omit({ id: true, kind: true }).partial()

export type ProviderKind = z.infer<typeof providerKind>
export type Setting = z.infer<typeof setting>
export type Provider = z.infer<typeof provider>
export type ProviderPatch = z.infer<typeof providerPatch>

type Base = { key: string; label: string; hint?: string }

export type Control = Base &
  (
    | { type: 'range'; min: number; max: number; step: number; value: number; unit?: string }
    | { type: 'choice'; options: Record<string, string>; value: string }
    | { type: 'toggle'; value: boolean }
    | { type: 'number'; min: number; max: number; value: number }
    | { type: 'text'; value: string; placeholder?: string }
  )
