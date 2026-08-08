<script setup lang="ts">
import { getPlatform, type PlatformKind } from '@opendesign/platform'
import { Button, Input } from '@opendesign/shadcn'
import { onMounted, ref } from 'vue'

const NOTE_KEY = 'demo.note'
const DOCS_URL = 'https://v2.tauri.app'

const kindLabels: Record<PlatformKind, string> = {
  browser: '浏览器',
  desktop: '桌面端',
  mobile: '移动端',
}

const layers = [
  { name: 'packages/platform', desc: '端能力契约与 web / native 两套实现' },
  { name: 'packages/app', desc: '一套核心应用：路由、布局、页面，只依赖契约' },
  { name: 'packages/components', desc: '项目自有组件，数据与事件走 props / emit' },
  { name: 'packages/shadcn', desc: 'shadcn-vue 源码基座与设计令牌' },
  { name: 'apps/web', desc: '浏览器薄壳，注入 web 实现后挂载' },
  { name: 'apps/native', desc: 'Tauri 薄壳，桌面与移动共用一份 Rust 工程' },
]

const platform = getPlatform()
const environment = ref('')
const note = ref('')
const saved = ref(false)
const error = ref('')

function setError(cause: unknown) {
  error.value = cause instanceof Error ? cause.message : String(cause)
}

onMounted(async () => {
  try {
    environment.value = await platform.describeEnvironment()
    note.value = (await platform.store.get<string>(NOTE_KEY)) ?? ''
  } catch (cause) {
    setError(cause)
  }
})

async function saveNote() {
  saved.value = false
  try {
    await platform.store.set(NOTE_KEY, note.value)
    saved.value = true
  } catch (cause) {
    setError(cause)
  }
}
</script>

<template>
  <div class="h-full overflow-y-auto px-6 py-10 sm:px-10 sm:py-12">
    <header>
      <h1 class="text-3xl font-semibold tracking-tight">opendesign.studio</h1>
      <p class="text-muted-foreground mt-2 text-sm">
        项目已初始化，一套核心逻辑跨浏览器、桌面与移动端
      </p>
    </header>

    <section class="bg-card mt-8 rounded-xl border p-5">
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p class="text-sm font-medium">当前端：{{ kindLabels[platform.kind] }}</p>
        <code class="text-muted-foreground text-xs">{{ platform.name }}</code>
      </div>
      <p class="text-muted-foreground mt-1 truncate text-xs" :title="environment">
        {{ environment }}
      </p>

      <div class="mt-4 flex flex-wrap items-center gap-2">
        <Input v-model="note" placeholder="写点什么，存到当前端的存储里" class="max-w-xs" />
        <Button size="sm" @click="saveNote">保存</Button>
        <Button size="sm" variant="outline" @click="platform.openUrl(DOCS_URL)">打开文档</Button>
        <span v-if="saved" class="text-muted-foreground text-xs">已写入，刷新后仍在</span>
      </div>

      <p v-if="error" class="text-destructive mt-3 text-sm">{{ error }}</p>
    </section>

    <h2 class="mt-10 text-sm font-medium">架构分层</h2>

    <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="layer in layers" :key="layer.name" class="bg-card rounded-xl border p-5">
        <code class="text-sm font-medium">{{ layer.name }}</code>
        <p class="text-muted-foreground mt-1 text-xs">{{ layer.desc }}</p>
      </div>
    </div>
  </div>
</template>
