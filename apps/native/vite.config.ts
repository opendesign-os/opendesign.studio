import { createAppPlugins } from '@opendesign/app/vite'
import { defineConfig, loadEnv } from 'vite'

const mobileHost = process.env.TAURI_DEV_HOST

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'API_')

  return {
    plugins: createAppPlugins(),
    envPrefix: ['VITE_', 'TAURI_ENV_'],
    server: {
      port: 5210,
      strictPort: true,
      host: mobileHost ?? false,
      hmr: mobileHost ? { protocol: 'ws', host: mobileHost, port: 5211 } : undefined,
      proxy: {
        '/api': { target: env.API_PROXY ?? 'http://localhost:5201', changeOrigin: true },
      },
    },
    build: {
      target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
      minify: !process.env.TAURI_ENV_DEBUG,
      sourcemap: Boolean(process.env.TAURI_ENV_DEBUG),
    },
  }
})
