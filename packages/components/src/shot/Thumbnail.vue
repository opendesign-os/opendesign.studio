<script setup lang="ts">
import { useTheme } from '@opendesign/composables'
import type { Shot } from '@opendesign/models'
import { computed } from 'vue'
import { cover } from './artwork'

const props = defineProps<{ shot: Shot }>()
const { dark } = useTheme()

const image = computed(() => cover(props.shot, dark.value))
</script>

<template>
  <div class="bg-stage relative overflow-hidden" :style="{ backgroundImage: image }">
    <slot />
  </div>
</template>
