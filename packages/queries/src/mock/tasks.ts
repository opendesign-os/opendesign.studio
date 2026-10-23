import type { ProviderKind, Task, TaskRequest } from '@opendesign/models'
import { slotLabel, viewLabel } from '@opendesign/models'
import { reject, remove, settle, store, sync } from './store'

function model(kind: ProviderKind) {
  return store.providers.find((item) => item.kind === kind)?.active ?? ''
}

function enqueue(task: Omit<Task, 'id' | 'status' | 'progress' | 'elapsed'>) {
  const created: Task = {
    ...task,
    id: `t-${Date.now()}`,
    status: 'queued',
    progress: 0,
    elapsed: 0,
  }
  store.tasks.unshift(created)
  return settle(created)
}

export function listTasks() {
  return settle(store.tasks)
}

export function createTask(request: TaskRequest) {
  if (request.kind === 'image') {
    const asset = store.assets.find((item) => item.id === request.assetId)
    if (!asset) return reject(`找不到资产 ${request.assetId}`)
    return enqueue({
      kind: 'image',
      title: `${asset.name} · ${viewLabel[request.view]}参考图`,
      seriesId: asset.seriesId,
      model: model('image'),
    })
  }

  if (request.kind === 'script' || request.kind === 'compose') {
    const episode = store.episodes.find((item) => item.id === request.episodeId)
    const series = store.series.find((item) => item.id === episode?.seriesId)
    if (!episode || !series) return reject(`找不到分集 ${request.episodeId}`)
    const script = request.kind === 'script'
    return enqueue({
      kind: request.kind,
      title: script
        ? `第 ${episode.index} 集 · 剧本拆解`
        : `${series.title} 第 ${episode.index} 集`,
      seriesId: series.id,
      episodeId: episode.id,
      model: script ? model('text') : 'ffmpeg',
    })
  }

  const shot = store.shots.find((item) => item.id === request.shotId)
  const episode = store.episodes.find((item) => item.id === shot?.episodeId)
  if (!shot || !episode) return reject(`找不到镜头 ${request.shotId}`)
  const target = { seriesId: episode.seriesId, episodeId: episode.id, shotId: shot.id }

  if (request.kind === 'keyframe') {
    const frame = shot.keyframes.find((item) => item.slot === request.slot)
    if (frame) frame.ready = true
    if (shot.status === 'draft') shot.status = 'keyframe'
    sync(episode.id)
    return enqueue({
      kind: 'keyframe',
      title: `镜 ${shot.index} · ${slotLabel[request.slot]}`,
      ...target,
      model: model('image'),
    })
  }

  if (request.kind === 'video') {
    shot.status = 'generating'
    sync(episode.id)
    return enqueue({
      kind: 'video',
      title: `镜 ${shot.index} · ${shot.scene}`,
      ...target,
      model: model('video'),
    })
  }

  return enqueue({
    kind: 'voice',
    title: `镜 ${shot.index} · 配音`,
    ...target,
    model: model('voice'),
  })
}

export function cancelTask(id: string) {
  const removed = remove(store.tasks, id)
  return removed ? settle(removed) : reject(`找不到任务 ${id}`)
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
