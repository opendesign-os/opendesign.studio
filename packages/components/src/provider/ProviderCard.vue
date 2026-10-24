<script setup lang="ts">
import { ChevronDown, RotateCcw } from '@lucide/vue'
import type { Model, Provider, ProviderPatch, Setting, Vendor } from '@opendesign/models'
import {
  controls,
  defaults,
  pacing,
  providerKindLabel,
  providerLabel,
  schedule,
  suggestions,
  supports,
} from '@opendesign/models'
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger, cn } from '@opendesign/shadcn'
import { computed, ref } from 'vue'
import Controls from '../form/Controls.vue'
import Picker from '../form/Picker.vue'
import Tip from '../layout/Tip.vue'
import ModelPicker from './ModelPicker.vue'

const props = defineProps<{
  provider: Provider
  vendors: Vendor[]
  models: Model[]
  pending?: boolean
  error?: string
}>()

const emit = defineEmits<{ patch: [patch: ProviderPatch] }>()

const heading = 'text-muted-foreground mb-1 text-micro font-medium tracking-[0.12em] uppercase'

const open = ref(false)

const vendor = computed(() => props.vendors.find((item) => item.id === props.provider.vendorId))

const choices = computed<Record<string, string>>(() =>
  Object.fromEntries(
    props.vendors
      .filter((item) => supports(item, props.provider.kind))
      .map((item) => [item.id, item.name]),
  ),
)

const suggested = computed(() =>
  vendor.value ? suggestions(vendor.value, props.provider.kind) : [],
)

const listed = computed(() =>
  props.models.filter((item) => !item.kind || item.kind === props.provider.kind),
)

const ready = computed(() => Boolean(vendor.value?.key && props.provider.active))

const timing = computed(() => ({
  concurrency: props.provider.concurrency,
  retries: props.provider.retries,
}))

function choose(id: string) {
  const next = props.vendors.find((item) => item.id === id)
  if (!next || id === props.provider.vendorId) return
  emit('patch', {
    vendorId: id,
    active: suggestions(next, props.provider.kind)[0] ?? '',
    fallback: '',
  })
}

function pick(name: 'active' | 'fallback', value: string) {
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
          <span class="text-data block font-medium">{{ providerLabel[provider.kind] }}</span>
          <span class="text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate text-micro">
            <span
              :class="cn('size-1.5 shrink-0 rounded-full', ready ? 'bg-success' : 'bg-container')"
            />
            {{ providerKindLabel[provider.kind] }} · {{ vendor?.name ?? '未选择厂商' }}
            <template v-if="vendor && !vendor.key">· 未填密钥</template>
            <template v-if="provider.fallback">· 备用 {{ provider.fallback }}</template>
          </span>
        </span>
      </CollapsibleTrigger>
      <ModelPicker
        :model-value="provider.active"
        :models="listed"
        :suggested="suggested"
        :pending="pending"
        :error="error"
        :disabled="!vendor"
        :placeholder="vendor ? '选择模型' : '先选择厂商'"
        @update:model-value="pick('active', $event)"
      />
    </div>

    <CollapsibleContent>
      <div class="border-border space-y-5 border-t px-4 pt-3 pb-4">
        <section>
          <h4 :class="heading">接入</h4>
          <div class="grid items-center gap-x-4 gap-y-2 @md:grid-cols-[7rem_1fr]">
            <span class="text-data">厂商</span>
            <Picker
              :model-value="provider.vendorId ?? ''"
              :options="choices"
              placeholder="选择厂商"
              @update:model-value="choose"
            />
          </div>
          <p v-if="!Object.keys(choices).length" class="text-muted-foreground mt-2 text-micro">
            还没有能做{{ providerKindLabel[provider.kind] }}生成的厂商，先在上方添加
          </p>
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
                <p class="text-muted-foreground mt-0.5 text-micro">
                  默认模型失败时改用它重试，留空则不启用
                </p>
              </div>
              <ModelPicker
                :model-value="provider.fallback"
                :models="listed"
                :suggested="suggested"
                :pending="pending"
                :error="error"
                :disabled="!vendor"
                placeholder="不启用"
                optional
                @update:model-value="pick('fallback', $event)"
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
