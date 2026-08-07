export type PlatformName = 'web' | 'windows' | 'macos' | 'linux' | 'android' | 'ios'

export type PlatformKind = 'browser' | 'desktop' | 'mobile'

export type PlatformStore = {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown): Promise<void>
  remove(key: string): Promise<void>
}

export type Platform = {
  name: PlatformName
  kind: PlatformKind
  store: PlatformStore
  openUrl(url: string): Promise<void>
  describeEnvironment(): Promise<string>
}
