<script setup lang="ts">
import { ChevronDown, Eye, EyeOff, LoaderCircle, PlugZap, RotateCcw } from '@lucide/vue'
import type { Probe, Provider, ProviderPatch, Setting } from '@opendesign/models'
import { controls, defaults, pacing, providerKindLabel, schedule } from '@opendesign/models'
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
  Input,
} from '@opendesign/shadcn'
import { computed, ref } from 'vue'
import Controls from '../form/Controls.vue'
import Picker from '../form/Picker.vue'
import Tip from '../layout/Tip.vue'

const props = defineProps<{ provider: Provider; probe?: Probe; testing?: boolean }>()

const emit = defineEmits<{ patch: [patch: ProviderPatch]; test: [] }>()

const NONE = 'none'
const heading = 'text-muted-foreground mb-1 text-micro font-medium tracking-[0.12em] uppercase'

const open = ref(false)
const reveal = ref(false)

const models = computed(() =>
  Object.fromEntries(props.provider.models.map((model) => [model, model])),
)

const fallbacks = computed(() => ({
  [NONE]: '不启用',
  ...Object.fromEntries(
    props.provider.models
      .filter((model) => model !== props.provider.active)
      .map((model) => [model, model]),
  ),
}))

const timing = computed(() => ({
  concurrency: props.provider.concurrency,
  retries: props.provider.retries,
}))

function field(name: 'endpoint' | 'key', event: Event) {
  const value = (event.target as HTMLInputElement).value.trim()
  if (value !== props.provider[name]) emit('patch', { [name]: value })
}

function tune(key: string, value: Setting) {
  emit('patch', { params: { ...props.provider.params, [key]: value } })
}

function pace(key: string, value: Setting) {
  if (typeof value === 'number') emit('patch', { [key]: value })
}

function reset() {
  emit('patch', { params: defaults(props.provider.kind), fallback: '', ...schedule })
}
</script>

<template>
  <Collapsible v-model:open="open" class="border-border bg-card @container rounded-xl border">
    <div class="flex items-center gap-3 p-3">
      <CollapsibleTrigger class="group flex min-w-0 flex-1 items-center gap-2.5 text-left">
        <ChevronDown
          class="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-data-[state=closed]:-rotate-90"
        />
        <span class="min-w-0">
          <span class="text-data block font-medium">{{ provider.label }}</span>
          <span class="text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate text-micro">
            <span
              :class="cn('size-1.5 shrink-0 rounded-full', provider.connected ? 'bg-success' : 'bg-container')"
            />
            {{ providerKindLabel[provider.kind] }} · {{ provider.connected ? '已连接' : '未连接' }}
            <template v-if="provider.fallback">· 备用 {{ provider.fallback }}</template>
          </span>
        </span>
      </CollapsibleTrigger>
      <Picker
        class="w-48"
        :model-value="provider.active"
        :options="models"
        @update:model-value="emit('patch', { active: $event })"
      />
    </div>

    <CollapsibleContent>
      <div class="border-border space-y-5 border-t px-4 pt-3 pb-4">
        <section>
          <h4 :class="heading">接入</h4>
          <div class="grid items-center gap-x-4 gap-y-2 @md:grid-cols-[7rem_1fr]">
            <label :for="`${provider.id}-endpoint`" class="text-data">服务地址</label>
            <Input
              :id="`${provider.id}-endpoint`"
              :model-value="provider.endpoint"
              placeholder="https://"
              class="font-mono"
              @change="field('endpoint', $event)"
            />
            <label :for="`${provider.id}-key`" class="text-data">密钥</label>
            <div class="flex items-center gap-1">
              <Input
                :id="`${provider.id}-key`"
                :type="reveal ? 'text' : 'password'"
                :model-value="provider.key"
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
              <Tip label="测试连接">
                <Button variant="outline" size="icon-sm" :disabled="testing" @click="emit('test')">
                  <LoaderCircle v-if="testing" class="animate-spin" />
                  <PlugZap v-else />
                </Button>
              </Tip>
            </div>
            <template v-if="probe">
              <span class="hidden @md:block" />
              <p :class="cn('text-micro', probe.ok ? 'text-success' : 'text-destructive')">
                {{ probe.message }}
              </p>
            </template>
          </div>
        </section>

        <section>
          <h4 :class="heading">生成参数</h4>
          <Controls :controls="controls[provider.kind]" :values="provider.params" @change="tune" />
        </section>

        <section>
          <h4 :class="heading">调度</h4>
          <div class="divide-border divide-y">
            <div class="flex items-center gap-4 py-2.5">
              <div class="min-w-0 flex-1">
                <p class="text-data">备用模型</p>
                <p class="text-muted-foreground mt-0.5 text-micro">默认模型连续失败时自动切换</p>
              </div>
              <Picker
                class="w-48"
                :model-value="provider.fallback || NONE"
                :options="fallbacks"
                @update:model-value="emit('patch', { fallback: $event === NONE ? '' : $event })"
              />
            </div>
          </div>
          <Controls :controls="pacing" :values="timing" class="border-border border-t" @change="pace" />
        </section>

        <div class="flex justify-end">
          <Tip label="恢复默认参数">
            <Button variant="ghost" size="icon-sm" class="text-muted-foreground" @click="reset">
              <RotateCcw />
            </Button>
          </Tip>
        </div>
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>
