import { z } from 'zod'

export const env = z.object({
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.url(),
  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  S3_ENDPOINT: z.url().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_PATH_STYLE: z.stringbool().default(false),
})

export type Env = z.infer<typeof env>
