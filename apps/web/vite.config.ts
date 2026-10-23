import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import { z } from 'zod'

const env = z.object({
  API_URL: z.url().default('http://localhost:3000'),
  TAURI_DEV_HOST: z.string().optional(),
})

export default defineConfig(({ mode }) => {
  const { API_URL, TAURI_DEV_HOST: host } = env.parse({
    ...loadEnv(mode, process.cwd(), ''),
    ...process.env,
  })

  return {
    plugins: [tanstackRouter({ target: 'vue', autoCodeSplitting: true }), vue(), tailwindcss()],
    server: {
      port: 5200,
      strictPort: true,
      host: host ?? false,
      hmr: host ? { protocol: 'ws', host, port: 5201 } : undefined,
      proxy: { '/api': API_URL },
    },
  }
})
