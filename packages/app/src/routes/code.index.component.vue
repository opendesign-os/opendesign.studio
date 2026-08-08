<script setup lang="ts">
import { ProjectCard } from '@opendesign/components'
import { useRouter } from '@tanstack/vue-router'
import { account } from '../data/nav'
import { languageTone, projects } from '../data/projects'

const accentTone: Record<string, string> = {
  TypeScript: 'bg-chart-3',
  Python: 'bg-chart-3',
  SQL: 'bg-chart-1',
  Shell: 'bg-chart-5',
  Go: 'bg-chart-3',
}

const router = useRouter()

function open(name: string) {
  router.navigate({ to: '/code/$name', params: { name } })
}
</script>

<template>
  <div class="h-full overflow-y-auto px-8 py-10">
    <div class="mx-auto max-w-[52rem]">
      <h1 class="text-[3.25rem] leading-none font-bold tracking-tight">CODE</h1>
      <p class="text-muted-foreground mt-4 text-sm">
        {{ projects.length }} projects · generated &amp; maintained by {{ account.model }}
      </p>

      <div class="mt-8 space-y-4 pb-10">
        <ProjectCard
          v-for="project in projects"
          :key="project.name"
          :name="project.name"
          :description="project.description"
          :language="project.language"
          :language-class="languageTone[project.language]"
          :accent-class="accentTone[project.language]"
          :files="project.files"
          :lines="project.lines"
          :branch="project.branch"
          :updated="project.updated"
          :status="project.status"
          :fill="project.fill"
          @open="open(project.name)"
        />
      </div>
    </div>
  </div>
</template>
