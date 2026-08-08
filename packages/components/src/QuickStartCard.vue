<script setup lang="ts">
import { Card } from '@opendesign/shadcn'
import type { Component } from 'vue'

defineProps<{ title: string; prompt: string; icon: Component }>()

const emit = defineEmits<{ select: [] }>()
</script>

<template>
  <Card
    class="border-border/60 bg-card/70 hover:bg-card cursor-pointer gap-0 p-4 shadow-none transition-colors"
    @click="emit('select')"
  >
    <div class="flex gap-3">
      <span class="bg-brand/10 text-brand flex size-8 shrink-0 items-center justify-center rounded-lg">
        <component :is="icon" class="size-4" />
      </span>
      <div class="min-w-0">
        <p class="text-sm font-medium">{{ title }}</p>
        <p class="text-muted-foreground mt-1 text-xs leading-relaxed">{{ prompt }}</p>
      </div>
    </div>
  </Card>
</template>
