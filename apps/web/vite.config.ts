import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  plugins: [tanstackRouter({ target: 'vue', autoCodeSplitting: true }), vue(), tailwindcss()],
  server: {
    port: 5200,
    strictPort: true,
    host: host ?? false,
    hmr: host ? { protocol: 'ws', host, port: 5201 } : undefined,
  },
})
