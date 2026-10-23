<script setup lang="ts">
import { useTheme } from '@opendesign/composables'
import type { Shot } from '@opendesign/models'
import { media } from '@opendesign/queries'
import { computed } from 'vue'
import { cover } from './artwork'

const props = defineProps<{ shot: Shot }>()
const { dark } = useTheme()

const image = computed(() => {
  const key = props.shot.keyframes.find((item) => item.slot === 'first')?.image
  return key ? `url(${media(key)})` : cover(props.shot, dark.value)
})
</script>

<template>
  <div class="bg-stage relative overflow-hidden bg-cover bg-center" :style="{ backgroundImage: image }">
    <slot />
  </div>
</template>
