import type { tasks } from '@opendesign/schemas'

export type Task = typeof tasks.$inferSelect

export type Context = {
  task: Task
  signal: AbortSignal
  progress: (value: number) => Promise<void>
}

export type Job = { run(context: Context): Promise<void> }
