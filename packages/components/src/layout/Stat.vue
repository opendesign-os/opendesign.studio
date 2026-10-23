<script setup lang="ts">
import { Card } from '@opendesign/shadcn'
import type { Component } from 'vue'

defineProps<{ label: string; value: string; hint?: string; icon?: Component }>()
</script>

<template>
  <Card class="gap-1.5 p-3 shadow-xs">
    <p class="text-muted-foreground flex items-center gap-1.5 text-meta">
      <component :is="icon" v-if="icon" class="size-3.5" />
      {{ label }}
    </p>
    <p class="text-2xl leading-none font-semibold tracking-tight tabular-nums">{{ value }}</p>
    <p v-if="hint" class="text-muted-foreground text-meta">{{ hint }}</p>
  </Card>
</template>
