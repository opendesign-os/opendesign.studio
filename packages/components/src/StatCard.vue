<script setup lang="ts">
import { Card } from '@opendesign/shadcn'
import type { Component } from 'vue'

defineProps<{ label: string; value: number; icon: Component; tone?: string }>()
</script>

<template>
  <Card class="border-border/60 bg-card/85 gap-0 p-4 shadow-none">
    <p class="text-muted-foreground flex items-center gap-1.5 text-xs">
      <component :is="icon" class="size-3.5" :class="tone" />
      {{ label }}
    </p>
    <p class="mt-2 text-2xl font-semibold tabular-nums">{{ value }}</p>
  </Card>
</template>
