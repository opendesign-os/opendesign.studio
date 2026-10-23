import type { Probe, ProviderPatch } from '@opendesign/models'
import { plain, reject, settle, store } from './store'

const PROBE = 600

export function listProviders() {
  return settle(store.providers)
}

export function patchProvider(id: string, patch: ProviderPatch) {
  const found = store.providers.find((item) => item.id === id)
  if (!found) return reject(`找不到供应商 ${id}`)
  Object.assign(found, plain(patch))
  if (patch.key !== undefined || patch.endpoint !== undefined) found.connected = false
  return settle(found)
}

export function testProvider(id: string) {
  const found = store.providers.find((item) => item.id === id)
  if (!found) return reject(`找不到供应商 ${id}`)
  const latency = 80 + Math.round(Math.random() * 240)
  const probe: Probe = !found.endpoint.trim()
    ? { ok: false, latency: 0, message: '缺少服务地址' }
    : found.key.trim().length < 8
      ? { ok: false, latency, message: '密钥无效或未填写' }
      : { ok: true, latency, message: `已连接 · ${latency} ms` }
  found.connected = probe.ok
  return new Promise<Probe>((resolve) => setTimeout(() => resolve(probe), PROBE))
}
