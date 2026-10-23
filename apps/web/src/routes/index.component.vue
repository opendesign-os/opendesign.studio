<script setup lang="ts">
import { LoaderCircle } from '@lucide/vue'
import { resume } from '@opendesign/models'
import { useAllEpisodes, useSeriesList } from '@opendesign/queries'
import { useRouter } from '@tanstack/vue-router'
import { computed, watchEffect } from 'vue'
import { recent } from '../recent'

const router = useRouter()
const { data: series } = useSeriesList()
const { data: episodes } = useAllEpisodes()

const target = computed(() => {
  const all = episodes.value ?? []
  const list = series.value ?? []
  const lead = list.find((item) => item.status === 'producing') ?? list[0]
  return (
    all.find((item) => item.id === recent.value) ??
    resume(all.filter((item) => item.seriesId === lead?.id))
  )
})

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
    <template v-if="empty">还没有作品</template>
    <template v-else>
      <LoaderCircle class="size-5 animate-spin" />
      正在打开工作区…
    </template>
  </div>
</template>
