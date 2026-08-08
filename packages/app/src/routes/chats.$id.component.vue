<script setup lang="ts">
import { Copy, RotateCcw, ThumbsDown, ThumbsUp } from '@lucide/vue'
import { ChatComposer, MessageBlocks } from '@opendesign/components'
import { Button } from '@opendesign/shadcn'
import { conversation } from '../data/chat'
import { account } from '../data/nav'

const feedback = [
  { id: 'copy', icon: Copy },
  { id: 'like', icon: ThumbsUp },
  { id: 'dislike', icon: ThumbsDown },
  { id: 'retry', icon: RotateCcw },
]
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="min-h-0 flex-1 overflow-y-auto px-6 pt-8">
      <div class="mx-auto max-w-[42rem] space-y-6">
        <template v-for="message in conversation" :key="message.id">
          <div v-if="message.role === 'user'" class="flex justify-end">
            <div class="bg-card/80 ring-border/60 max-w-[85%] rounded-2xl px-5 py-3.5 ring-1">
              <MessageBlocks :blocks="message.blocks" />
            </div>
          </div>

          <div v-else>
            <article class="bg-card/90 ring-border/60 rounded-2xl px-8 py-7 shadow-xs ring-1">
              <MessageBlocks :blocks="message.blocks" />
            </article>

            <div class="text-muted-foreground mt-3 flex items-center gap-1">
              <Button
                v-for="item in feedback"
                :key="item.id"
                variant="ghost"
                size="icon"
                class="size-8 rounded-lg"
              >
                <component :is="item.icon" class="size-4" />
              </Button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="shrink-0 px-6 pt-4 pb-3">
      <div class="mx-auto max-w-[42rem]">
        <ChatComposer placeholder="Continue the conversation…" :model="account.model" />
        <p class="text-muted-foreground mt-2 text-center text-xs">
          AXIOM can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  </div>
</template>
