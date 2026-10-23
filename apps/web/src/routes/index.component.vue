<script setup lang="ts">
import { LoaderCircle, Plus } from '@lucide/vue'
import { resume } from '@opendesign/models'
import { useEpisodes, useSeriesList } from '@opendesign/queries'
import { Button } from '@opendesign/shadcn'
import { useRouter } from '@tanstack/vue-router'
import { computed, ref, watchEffect } from 'vue'
import CreateSeries from '../components/series/CreateSeries.vue'
import { recent } from '../composables/workspace'

const router = useRouter()
const { data: series } = useSeriesList()
const { data: episodes } = useEpisodes()

const target = computed(() => {
  const all = episodes.value ?? []
  const list = series.value ?? []
  const lead = list.find((item) => item.status === 'producing') ?? list[0]
  return (
    all.find((item) => item.id === recent.value) ??
    resume(all.filter((item) => item.seriesId === lead?.id))
  )
})

const creating = ref(false)

const empty = computed(() => Boolean(series.value && episodes.value && !target.value))

watchEffect(() => {
  const episode = target.value
  if (!episode) return
  void router.navigate({
    to: episode.shots ? '/episode/$id/edit' : '/episode/$id/script',
    params: { id: episode.id },
    replace: true,
  })
})
</script>

<template>
  <div class="page-hint">
    <template v-if="empty">
      <p>还没有作品</p>
      <Button size="sm" @click="creating = true">
        <Plus />
        新建作品
      </Button>
      <CreateSeries v-model="creating" />
    </template>
    <template v-else>
      <LoaderCircle class="size-5 animate-spin" />
      正在打开工作区…
    </template>
  </div>
</template>
