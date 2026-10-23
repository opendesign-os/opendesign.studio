import { Param } from '@nestjs/common'
import { z } from 'zod'

export function Id(name = 'id') {
  return Param(name, { schema: z.uuid() })
}
