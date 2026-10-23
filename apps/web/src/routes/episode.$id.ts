import { createFileRoute } from '@tanstack/vue-router'
import { z } from 'zod'

export const Route = createFileRoute('/episode/$id')({
  validateSearch: z.object({ shot: z.string().optional() }),
})
