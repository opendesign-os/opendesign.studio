<script setup lang="ts">
import { ArrowLeft, ChevronRight, Copy, File, GitBranch, Terminal, X, Zap } from '@lucide/vue'
import { CodeView, FileTree } from '@opendesign/components'
import { Badge, ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@opendesign/shadcn'
import { useRouter } from '@tanstack/vue-router'
import { computed, ref } from 'vue'
import { openTabs, repository, sources, tree } from '../data/code'
import { account } from '../data/nav'

const router = useRouter()

const tabs = ref<string[]>([...openTabs])
const active = ref(openTabs[0] ?? '')

const source = computed(() => sources[active.value])
const lines = computed(() => source.value?.code.trimEnd().split('\n').length ?? 0)
const crumbs = computed(() => [repository, ...active.value.split('/')])

function open(path: string) {
  if (!sources[path]) return
  if (!tabs.value.includes(path)) tabs.value.push(path)
  active.value = path
}

function close(path: string) {
  tabs.value = tabs.value.filter((item) => item !== path)
  if (active.value === path) active.value = tabs.value[0] ?? ''
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="border-border/50 flex h-11 shrink-0 items-center gap-1 border-b px-3">
      <button
        type="button"
        class="text-muted-foreground hover:text-foreground mr-2 flex items-center gap-1.5 px-2 text-sm transition-colors"
        @click="router.navigate({ to: '/code' })"
      >
        <ArrowLeft class="size-3.5" />
        Code
      </button>

      <button
        v-for="path in tabs"
        :key="path"
        type="button"
        class="flex h-11 items-center gap-2 border-b-2 px-3.5 text-sm transition-colors"
        :class="
          active === path
            ? 'border-brand bg-card text-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground border-transparent'
        "
        @click="active = path"
      >
        <File class="size-3.5 opacity-70" />
        {{ sources[path]?.name }}
        <X
          class="size-3.5 opacity-40 transition-opacity hover:opacity-100"
          @click.stop="close(path)"
        />
      </button>

      <div class="ml-auto flex items-center gap-2">
        <button
          type="button"
          class="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
        >
          <Copy class="size-3.5" />
          Copy
        </button>
        <Badge
          variant="secondary"
          class="text-brand bg-brand/10 gap-1 rounded-full px-2.5 py-1 text-xs font-normal"
        >
          <GitBranch class="size-3" />
          main
        </Badge>
      </div>
    </div>

    <ResizablePanelGroup direction="horizontal" class="min-h-0 flex-1">
      <ResizablePanel :default-size="22" :min-size="14" :max-size="40">
        <div class="scroll-surface h-full overflow-y-auto px-3 py-4">
          <p class="text-muted-foreground px-2 text-[0.6875rem] tracking-[0.14em] uppercase">
            {{ repository }}
          </p>
          <FileTree class="mt-3" :nodes="tree" :active="active" @open="open" />
        </div>
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel>
        <div class="flex h-full flex-col">
          <div
            class="border-border/50 text-muted-foreground flex h-9 shrink-0 items-center gap-1 border-b px-4 text-xs"
          >
            <template v-for="(crumb, index) in crumbs" :key="crumb">
              <ChevronRight v-if="index" class="size-3 opacity-60" />
              <span :class="index === crumbs.length - 1 && 'text-foreground'">{{ crumb }}</span>
            </template>
          </div>

          <div class="scroll-surface min-h-0 flex-1 overflow-auto px-4 py-3">
            <CodeView v-if="source" :code="source.code" :language="source.language" />
            <p v-else class="page-hint">选一个文件查看源码</p>
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>

    <div
      class="border-border/50 text-muted-foreground flex h-8 shrink-0 items-center gap-4 border-t px-4 text-xs"
    >
      <span class="flex items-center gap-1.5">
        <Terminal class="size-3.5" />
        TypeScript
      </span>
      <span>{{ lines }} lines</span>
      <span>UTF-8</span>
      <span class="text-brand ml-auto flex items-center gap-1.5">
        <Zap class="size-3.5" />
        {{ account.model }}
      </span>
    </div>
  </div>
</template>
