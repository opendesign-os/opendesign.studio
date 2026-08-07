import type { Platform, PlatformStore } from './types'

function createLocalStorageStore(): PlatformStore {
  return {
    async get<T>(key: string) {
      const raw = localStorage.getItem(key)
      return raw === null ? null : (JSON.parse(raw) as T)
    },
    async set(key, value) {
      localStorage.setItem(key, JSON.stringify(value))
    },
    async remove(key) {
      localStorage.removeItem(key)
    },
  }
}

export function createWebPlatform(): Platform {
  return {
    name: 'web',
    kind: 'browser',
    store: createLocalStorageStore(),
    async openUrl(url) {
      window.open(url, '_blank', 'noreferrer')
    },
    async describeEnvironment() {
      return navigator.userAgent
    },
  }
}
