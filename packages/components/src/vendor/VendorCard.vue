<script setup lang="ts">
import { ChevronDown, Eye, EyeOff, LoaderCircle, RefreshCw, Trash2 } from '@lucide/vue'
import type { Model, Protocol, Vendor, VendorPatch } from '@opendesign/models'
import { protocolLabel } from '@opendesign/models'
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
  Input,
} from '@opendesign/shadcn'
import { computed, ref } from 'vue'
import Picker from '../form/Picker.vue'
import Tip from '../layout/Tip.vue'

const props = defineProps<{
  vendor: Vendor
  models: Model[]
  pending?: boolean
  error?: string
  defaultOpen?: boolean
}>()

const emit = defineEmits<{ patch: [patch: VendorPatch]; remove: []; refresh: [] }>()

const reveal = ref(false)

const address = computed(() => props.vendor.endpoint.replace(/^https?:\/\//, ''))

const state = computed(() => {
  const waiting = '填好服务地址和密钥后自动拉取模型列表'
  if (!props.vendor.endpoint) return { tone: 'idle', label: '未填服务地址', detail: waiting }
  if (!props.vendor.key) return { tone: 'idle', label: '未填密钥', detail: waiting }
  if (props.pending) return { tone: 'idle', label: '拉取中', detail: '正在拉取模型列表…' }
  if (props.error) return { tone: 'error', label: '拉取失败', detail: props.error }
  if (!props.models.length) {
    return {
      tone: 'ready',
      label: '未提供模型列表',
      detail: '厂商没有提供模型列表，在下方能力里直接填写模型 ID',
    }
  }
  return {
    tone: 'ready',
    label: `${props.models.length} 个模型`,
    detail: `已拉取 ${props.models.length} 个模型，在下方能力里选用`,
  }
})

function field(name: 'name' | 'endpoint' | 'key', event: Event) {
  const value = (event.target as HTMLInputElement).value.trim()
  if (value !== props.vendor[name]) emit('patch', { [name]: value })
}

function choose(value: Protocol) {
  if (value !== props.vendor.protocol) emit('patch', { protocol: value })
}
</script>

<template>
  <Collapsible :default-open="defaultOpen" class="border-border bg-card @container rounded-xl border">
    <div class="flex items-center gap-3 p-3">
      <CollapsibleTrigger class="group flex min-w-0 flex-1 items-center gap-2.5 text-left">
        <ChevronDown
          class="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-data-[state=closed]:-rotate-90"
        />
        <span class="min-w-0">
          <span class="text-data block truncate font-medium">{{ vendor.name }}</span>
          <span class="text-muted-foreground mt-0.5 block truncate text-micro">
            {{ protocolLabel[vendor.protocol] }} · {{ address || '未填服务地址' }}
          </span>
        </span>
      </CollapsibleTrigger>
      <span
        :class="
          cn(
            'flex shrink-0 items-center gap-1.5 text-micro',
            state.tone === 'error' ? 'text-destructive' : 'text-muted-foreground',
          )
        "
      >
        <LoaderCircle v-if="pending" class="size-3 animate-spin" />
        <span
          v-else
          :class="
            cn(
              'size-1.5 rounded-full',
              state.tone === 'ready' && 'bg-success',
              state.tone === 'error' && 'bg-destructive',
              state.tone === 'idle' && 'bg-container',
            )
          "
        />
        {{ state.label }}
      </span>
    </div>

    <CollapsibleContent>
      <div class="border-border space-y-3 border-t px-4 pt-3 pb-4">
        <div class="grid items-center gap-x-4 gap-y-2 @md:grid-cols-[7rem_1fr]">
          <label :for="`${vendor.id}-name`" class="text-data">名称</label>
          <Input
            :id="`${vendor.id}-name`"
            :model-value="vendor.name"
            maxlength="40"
            @change="field('name', $event)"
          />
          <span class="text-data">接口类型</span>
          <Picker
            v-if="!vendor.preset"
            :model-value="vendor.protocol"
            :options="protocolLabel"
            @update:model-value="choose"
          />
          <span v-else class="text-muted-foreground text-data">
            {{ protocolLabel[vendor.protocol] }}
          </span>
          <label :for="`${vendor.id}-endpoint`" class="text-data">服务地址</label>
          <Input
            :id="`${vendor.id}-endpoint`"
            :model-value="vendor.endpoint"
            placeholder="https://"
            class="font-mono"
            @change="field('endpoint', $event)"
          />
          <label :for="`${vendor.id}-key`" class="text-data">密钥</label>
          <div class="flex items-center gap-1">
            <Input
              :id="`${vendor.id}-key`"
              :type="reveal ? 'text' : 'password'"
              :model-value="vendor.key"
              placeholder="粘贴 API Key"
              autocomplete="off"
              class="font-mono"
              @change="field('key', $event)"
            />
            <Tip :label="reveal ? '隐藏密钥' : '显示密钥'">
              <Button variant="ghost" size="icon-sm" @click="reveal = !reveal">
                <EyeOff v-if="reveal" />
                <Eye v-else />
              </Button>
            </Tip>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <p
            :class="
              cn(
                'min-w-0 flex-1 text-micro',
                state.tone === 'error' ? 'text-destructive' : 'text-muted-foreground',
              )
            "
          >
            {{ state.detail }}
          </p>
          <Tip label="重新拉取模型">
            <Button
              variant="ghost"
              size="icon-sm"
              class="text-muted-foreground"
              :disabled="!vendor.endpoint || !vendor.key || pending"
              @click="emit('refresh')"
            >
              <RefreshCw />
            </Button>
          </Tip>
          <Tip label="删除厂商">
            <Button
              variant="ghost"
              size="icon-sm"
              class="text-destructive hover:text-destructive"
              @click="emit('remove')"
            >
              <Trash2 />
            </Button>
          </Tip>
        </div>
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>
