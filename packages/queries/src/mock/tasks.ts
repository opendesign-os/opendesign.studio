import { reject, settle, store } from './store'

export function listTasks() {
  return settle(store.tasks)
}

export function cancelTask(id: string) {
  const index = store.tasks.findIndex((item) => item.id === id)
  if (index < 0) return reject(`找不到任务 ${id}`)
  store.tasks.splice(index, 1)
  return settle(id)
}

export function retryTask(id: string) {
  const found = store.tasks.find((item) => item.id === id)
  if (!found) return reject(`找不到任务 ${id}`)
  found.status = 'queued'
  found.progress = 0
  found.elapsed = 0
  found.error = undefined
  return settle(found)
}
