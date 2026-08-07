import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import vue from '@vitejs/plugin-vue'
import type { PluginOption } from 'vite'

const sourceDir = fileURLToPath(new URL('./src', import.meta.url))

export function createAppPlugins(): PluginOption[] {
  return [
    tanstackRouter({
      target: 'vue',
      autoCodeSplitting: true,
      routesDirectory: `${sourceDir}/routes`,
      generatedRouteTree: `${sourceDir}/routeTree.gen.ts`,
    }),
    vue(),
    tailwindcss(),
  ]
}
