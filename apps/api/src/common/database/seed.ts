import type { TaskRequest } from '@opendesign/models'
import * as schema from '@opendesign/schemas'
import {
  assets,
  candidates,
  episodes,
  members,
  relations,
  series,
  shots,
  tasks,
  users,
} from '@opendesign/schemas'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { env } from '../../config/env'
import { createAuth } from '../../modules/auth/auth'
import * as demo from './demo'

const account = { name: '演示账号', email: 'demo@opendesign.studio', password: 'opendesign-demo' }

const config = env.parse(process.env)
const db = drizzle({ connection: config.DATABASE_URL, schema })
const auth = createAuth(db, { baseURL: config.BETTER_AUTH_URL, secret: config.BETTER_AUTH_SECRET })

const ids = new Map<string, string>()

function id(key: string) {
  const value = ids.get(key) ?? crypto.randomUUID()
  ids.set(key, value)
  return value
}

function remap(request: TaskRequest): TaskRequest {
  if ('shotId' in request) return { ...request, shotId: id(request.shotId) }
  if ('episodeId' in request) return { ...request, episodeId: id(request.episodeId) }
  return { ...request, assetId: id(request.assetId) }
}

async function seed() {
  const [existing] = await db.select().from(users).where(eq(users.email, account.email))
  if (existing) return console.log(`${account.email} 已存在，跳过`)

  const { user } = await auth.api.signUpEmail({ body: account })
  const [member] = await db.select().from(members).where(eq(members.userId, user.id))
  if (!member) throw new Error('演示账号没有团队')
  const organizationId = member.organizationId
  const now = Date.now()

  await db.transaction(async (tx) => {
    await tx
      .insert(series)
      .values(demo.series.map((item) => ({ ...item, id: id(item.id), organizationId })))
    await tx.insert(episodes).values(
      demo.episodes.map((item) => ({
        ...item,
        id: id(item.id),
        seriesId: id(item.seriesId),
        organizationId,
      })),
    )
    await tx.insert(assets).values(
      demo.assets.map((item) => ({
        ...item,
        id: id(item.id),
        seriesId: id(item.seriesId),
        organizationId,
      })),
    )
    await tx.insert(candidates).values(
      demo.candidates.map((item) => ({
        ...item,
        id: id(item.id),
        episodeId: id(item.episodeId),
        organizationId,
      })),
    )
    await tx.insert(relations).values(
      demo.relations.map((item) => ({
        ...item,
        id: id(item.id),
        seriesId: id(item.seriesId),
        from: id(item.from),
        to: id(item.to),
        organizationId,
      })),
    )
    await tx.insert(shots).values(
      demo.shots.map((item) => ({
        ...item,
        id: id(item.id),
        episodeId: id(item.episodeId),
        cast: item.cast.map(id),
        dialogue: item.dialogue.map((line) => ({ ...line, assetId: id(line.assetId) })),
        bubbles: item.bubbles.map((bubble) => ({ ...bubble, assetId: id(bubble.assetId) })),
        organizationId,
      })),
    )
    await tx.insert(tasks).values(
      demo.tasks
        .filter((item) => item.status === 'done' || item.status === 'failed')
        .map((item) => ({
          ...item,
          id: id(item.id),
          request: remap(item.request),
          seriesId: id(item.seriesId),
          episodeId: item.episodeId && id(item.episodeId),
          shotId: item.shotId && id(item.shotId),
          startedAt: item.status === 'queued' ? null : new Date(now - item.elapsed * 1000),
          finishedAt: item.status === 'done' || item.status === 'failed' ? new Date(now) : null,
          organizationId,
        })),
    )
  })
  console.log(`已创建演示账号 ${account.email}`)
}

await seed()
await db.$client.end()
