import type { Platform } from './types'

export type * from './types'

let currentPlatform: Platform | undefined

export function setPlatform(platform: Platform) {
  currentPlatform = platform
}

export function getPlatform(): Platform {
  if (!currentPlatform) throw new Error('平台实现未注入，请在入口先调用 setPlatform()')
  return currentPlatform
}
