<script setup lang="ts">
import type { SplitterResizeHandleEmits, SplitterResizeHandleProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { SplitterResizeHandle, useForwardPropsEmits } from "reka-ui"
import { cn } from "../../lib/utils"

const props = defineProps<SplitterResizeHandleProps & { class?: HTMLAttributes["class"] }>()
const emits = defineEmits<SplitterResizeHandleEmits>()

const delegatedProps = reactiveOmit(props, "class")
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SplitterResizeHandle
    data-slot="resizable-handle"
    v-bind="forwarded"
    :class="cn(
      'group/handle bg-border relative flex w-px shrink-0 cursor-col-resize touch-none items-center justify-center outline-hidden transition-colors duration-150',
      'after:absolute after:inset-y-0 after:left-1/2 after:w-3 after:-translate-x-1/2',
      'data-[resize-handle-state=drag]:bg-primary data-[resize-handle-state=hover]:bg-primary/50 focus-visible:bg-primary',
      'data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full data-[orientation=vertical]:cursor-row-resize data-[orientation=vertical]:after:inset-auto data-[orientation=vertical]:after:top-1/2 data-[orientation=vertical]:after:left-0 data-[orientation=vertical]:after:h-3 data-[orientation=vertical]:after:w-full data-[orientation=vertical]:after:translate-x-0 data-[orientation=vertical]:after:-translate-y-1/2',
      props.class,
    )"
  >
    <span
      class="bg-muted-foreground/35 ring-background group-data-[resize-handle-state=drag]/handle:bg-primary group-data-[resize-handle-state=hover]/handle:bg-primary z-10 h-8 w-1 shrink-0 rounded-full ring-2 transition-colors duration-150 group-data-[orientation=vertical]/handle:h-1 group-data-[orientation=vertical]/handle:w-8"
    />
  </SplitterResizeHandle>
</template>
