<script setup lang="ts">
import { Compass } from '@lucide/vue'
import { Link } from '@tanstack/vue-router'
</script>

<template>
  <div class="page-hint text-muted-foreground">
    <Compass class="size-6" />
    <p>页面不存在</p>
    <Link to="/" class="text-primary hover:underline">回到首页</Link>
  </div>
</template>
