<script setup lang="ts">
import type { ShotStatus } from '@opendesign/models'
import { shotStatusLabel } from '@opendesign/models'
import { Badge } from '@opendesign/shadcn'
import { statusTone } from '../tone'

defineProps<{ status: ShotStatus }>()
</script>

<template>
  <Badge :variant="statusTone[status]">
    <span class="size-1.5 rounded-full bg-current" />
    {{ shotStatusLabel[status] }}
  </Badge>
</template>
