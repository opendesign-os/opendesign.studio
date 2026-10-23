<script setup lang="ts">
import type { ShotStatus } from '@opendesign/models'
import { shotStatusLabel } from '@opendesign/models'
import { Badge } from '@opendesign/shadcn'
import { tones } from '../common/tone'

defineProps<{ status: ShotStatus }>()
</script>

<template>
  <Badge :variant="tones.shot[status]">
    <span class="size-1.5 rounded-full bg-current" />
    {{ shotStatusLabel[status] }}
  </Badge>
</template>
