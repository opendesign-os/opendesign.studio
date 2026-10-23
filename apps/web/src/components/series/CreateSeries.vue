<script setup lang="ts">
import { SeriesForm } from '@opendesign/components'
import type { Series, SeriesDraft } from '@opendesign/models'
import { useCreateSeries } from '@opendesign/queries'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@opendesign/shadcn'

const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ created: [series: Series] }>()

const create = useCreateSeries()

function submit(draft: SeriesDraft) {
  create.mutate(draft, {
    onSuccess: (series) => {
      open.value = false
      emit('created', series)
    },
  })
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>新建作品</DialogTitle>
        <DialogDescription>第 1 集会一起建好，之后可以继续加分集</DialogDescription>
      </DialogHeader>
      <SeriesForm :busy="create.isPending.value" @submit="submit" />
    </DialogContent>
  </Dialog>
</template>
