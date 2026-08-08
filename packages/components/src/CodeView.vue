<script setup lang="ts">
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { shallowRef, watchEffect } from 'vue'

const props = defineProps<{ code: string; language: string }>()

let pending: Promise<HighlighterCore> | null = null

function getOrCreateHighlighter() {
  pending ??= createHighlighterCore({
    themes: [import('shiki/themes/vitesse-light.mjs'), import('shiki/themes/vitesse-dark.mjs')],
    langs: [import('shiki/langs/typescript.mjs'), import('shiki/langs/json.mjs')],
    engine: createJavaScriptRegexEngine(),
  })
  return pending
}

const html = shallowRef('')

watchEffect(async () => {
  const highlighter = await getOrCreateHighlighter()
  html.value = highlighter.codeToHtml(props.code, {
    lang: props.language,
    themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
    defaultColor: false,
  })
})
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="code-view" v-html="html" />
</template>

<style>
.code-view .shiki {
  background-color: transparent !important;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.65;
}

.code-view .shiki code {
  display: grid;
  counter-reset: line;
}

.code-view .shiki .line::before {
  counter-increment: line;
  content: counter(line);
  display: inline-block;
  width: 2.25rem;
  margin-right: 1.5rem;
  text-align: right;
  color: var(--muted-foreground);
  opacity: 0.55;
}

.code-view .shiki span {
  color: var(--shiki-light);
}

.dark .code-view .shiki span {
  color: var(--shiki-dark);
}
</style>
