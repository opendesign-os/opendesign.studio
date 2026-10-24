<script setup lang="ts">
import { useTheme } from '@opendesign/composables'
import type { Shot } from '@opendesign/models'
import { computed } from 'vue'
import { poster } from './artwork'

const props = defineProps<{ shot: Shot }>()
const { dark } = useTheme()

const image = computed(() => poster(props.shot, dark.value))
</script>

<template>
  <div class="bg-stage relative overflow-hidden bg-cover bg-center" :style="{ backgroundImage: image }">
    <slot />
  </div>
</template>
