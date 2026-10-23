import * as schema from '@opendesign/schemas'
import { members, organizations, users } from '@opendesign/schemas'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization } from 'better-auth/plugins'
import { asc, eq } from 'drizzle-orm'
import type { Request } from 'express'
import type { Database } from '../../common/database/database.module'

export const AUTH = Symbol('auth')

async function team(db: Database, userId: string) {
  const [member] = await db
    .select({ organizationId: members.organizationId })
    .from(members)
    .where(eq(members.userId, userId))
    .orderBy(asc(members.createdAt))
    .limit(1)
  if (member) return member.organizationId
  return db.transaction(async (tx) => {
    const [user] = await tx.select({ name: users.name }).from(users).where(eq(users.id, userId))
    const [created] = await tx
      .insert(organizations)
      .values({ name: `${user?.name ?? '我'}的团队`, slug: userId })
      .returning({ id: organizations.id })
    if (!created) throw new Error('创建团队失败')
    await tx.insert(members).values({ organizationId: created.id, userId, role: 'owner' })
    return created.id
  })
}

export function createAuth(db: Database, options: { baseURL: string; secret: string }) {
  return betterAuth({
    ...options,
    database: drizzleAdapter(db, { provider: 'pg', usePlural: true, schema }),
    advanced: { database: { generateId: 'uuid' } },
    emailAndPassword: { enabled: true },
    plugins: [organization()],
    databaseHooks: {
      session: {
        create: {
          before: async (session) => ({
            data: { ...session, activeOrganizationId: await team(db, session.userId) },
          }),
        },
      },
    },
  })
}

export type Auth = ReturnType<typeof createAuth>

export type Session = Auth['$Infer']['Session']

export type Incoming = Request & { session?: Session }
