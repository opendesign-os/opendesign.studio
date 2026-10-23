import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: '../../packages/schemas/src/index.ts',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
})
