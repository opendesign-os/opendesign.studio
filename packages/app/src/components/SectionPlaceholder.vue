<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ title: string; icon: Component }>()
</script>

<template>
  <div class="page-hint">
    <span class="bg-card/70 ring-border/60 flex size-11 items-center justify-center rounded-2xl ring-1">
      <component :is="icon" class="size-5" />
    </span>
    <p>{{ title }} 还在建设中</p>
  </div>
</template>
