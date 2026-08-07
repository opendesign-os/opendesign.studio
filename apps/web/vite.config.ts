import { createAppPlugins } from '@opendesign/app/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'API_')

  return {
    plugins: createAppPlugins(),
    server: {
      port: 5200,
      strictPort: true,
      proxy: {
        '/api': { target: env.API_PROXY ?? 'http://localhost:5201', changeOrigin: true },
      },
    },
  }
})
