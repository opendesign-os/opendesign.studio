import { getVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api/core'
import { openUrl } from '@tauri-apps/plugin-opener'
import { load, type Store as TauriStore } from '@tauri-apps/plugin-store'
import type { Platform, PlatformKind, PlatformName, PlatformStore } from './types'

const desktopPlatforms: PlatformName[] = ['windows', 'macos', 'linux']

function getPlatformName(): PlatformName {
  return (import.meta.env.TAURI_ENV_PLATFORM ?? 'windows') as PlatformName
}

function getPlatformKind(name: PlatformName): PlatformKind {
  return desktopPlatforms.includes(name) ? 'desktop' : 'mobile'
}

function createFileStore(file: TauriStore): PlatformStore {
  return {
    async get<T>(key: string) {
      return (await file.get<T>(key)) ?? null
    },
    async set(key, value) {
      await file.set(key, value)
    },
    async remove(key) {
      await file.delete(key)
    },
  }
}

export async function createNativePlatform(): Promise<Platform> {
  const name = getPlatformName()
  const version = await getVersion()
  const settingsFile = await load('settings.json', { autoSave: true })

  return {
    name,
    kind: getPlatformKind(name),
    store: createFileStore(settingsFile),
    openUrl,
    async describeEnvironment() {
      return `${await invoke<string>('system_info')} · v${version}`
    },
  }
}
