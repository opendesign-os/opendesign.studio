/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  readonly TAURI_ENV_PLATFORM?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
