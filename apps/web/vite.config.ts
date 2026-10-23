import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const source = fileURLToPath(new URL('./src', import.meta.url))
const host = process.env.TAURI_DEV_HOST
const shell = process.env.TAURI_ENV_PLATFORM

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'vue',
      autoCodeSplitting: true,
      routesDirectory: `${source}/routes`,
      generatedRouteTree: `${source}/routeTree.gen.ts`,
    }),
    vue(),
    tailwindcss(),
  ],
  server: {
    port: 5200,
    strictPort: true,
    host: host ?? false,
    hmr: host ? { protocol: 'ws', host, port: 5201 } : undefined,
  },
  build: shell
    ? {
        target: shell === 'windows' ? 'chrome105' : 'safari13',
        minify: !process.env.TAURI_ENV_DEBUG,
        sourcemap: Boolean(process.env.TAURI_ENV_DEBUG),
      }
    : undefined,
})
