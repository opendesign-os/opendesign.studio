<script setup lang="ts">
import { Trash2 } from '@lucide/vue'
import type { AssetDraft } from '@opendesign/models'
import { assetDraft, assetKindLabel, roleLabel, voiceLabel } from '@opendesign/models'
import { Button, Field, FieldError, FieldLabel, Input, Textarea } from '@opendesign/shadcn'
import { useForm } from '@tanstack/vue-form'
import Picker from '../form/Picker.vue'
import Tip from '../layout/Tip.vue'

const props = defineProps<{ value: AssetDraft; busy: boolean; submitLabel: string }>()
const emit = defineEmits<{ submit: [draft: AssetDraft]; remove: [] }>()

const form = useForm({
  defaultValues: { ...props.value },
  validators: { onChange: assetDraft },
  onSubmit: ({ value }) => emit('submit', value),
})
</script>

<template>
  <form class="space-y-4" @submit.prevent="form.handleSubmit()">
    <div class="grid grid-cols-2 gap-3">
      <form.Field v-slot="{ field }" name="kind">
        <Field>
          <FieldLabel>类型</FieldLabel>
          <Picker
            :model-value="field.state.value"
            :options="assetKindLabel"
            @update:model-value="field.handleChange"
          />
        </Field>
      </form.Field>

      <form.Field v-slot="{ field, state }" name="name">
        <Field :data-invalid="state.meta.errors.length > 0">
          <FieldLabel :for="field.name">名称</FieldLabel>
          <Input
            :id="field.name"
            :model-value="field.state.value"
            placeholder="顾晚 / 地铁站台 / 旧车票"
            @update:model-value="field.handleChange(String($event))"
            @blur="field.handleBlur"
          />
          <FieldError :errors="state.meta.errors" />
        </Field>
      </form.Field>
    </div>

    <form.Field v-slot="{ field }" name="summary">
      <Field>
        <FieldLabel :for="field.name">一句话</FieldLabel>
        <Input
          :id="field.name"
          :model-value="field.state.value"
          placeholder="克制的观察者"
          @update:model-value="field.handleChange(String($event))"
        />
      </Field>
    </form.Field>

    <form.Field v-slot="{ field, state }" name="prompt">
      <Field :data-invalid="state.meta.errors.length > 0">
        <FieldLabel :for="field.name">
          生成描述
          <span class="opacity-60">· 会拼进每一次出图的提示词</span>
        </FieldLabel>
        <Textarea
          :id="field.name"
          :model-value="field.state.value"
          rows="5"
          class="leading-relaxed"
          placeholder="外形、材质、光线、风格……越具体，跨镜一致性越稳"
          @update:model-value="field.handleChange(String($event))"
          @blur="field.handleBlur"
        />
        <FieldError :errors="state.meta.errors" />
      </Field>
    </form.Field>

    <form.Subscribe v-slot="kind" :selector="(state) => state.values.kind">
      <div v-if="kind === 'character'" class="grid grid-cols-2 gap-3">
        <form.Field v-slot="{ field }" name="role">
          <Field>
            <FieldLabel>定位</FieldLabel>
            <Picker
              :model-value="field.state.value ?? 'support'"
              :options="roleLabel"
              @update:model-value="field.handleChange"
            />
          </Field>
        </form.Field>

        <form.Field v-slot="{ field }" name="voice">
          <Field>
            <FieldLabel>音色</FieldLabel>
            <Picker
              :model-value="field.state.value ?? 'warm-male'"
              :options="voiceLabel"
              @update:model-value="field.handleChange"
            />
          </Field>
        </form.Field>
      </div>
    </form.Subscribe>

    <form.Field v-slot="{ field, state }" name="color">
      <Field :data-invalid="state.meta.errors.length > 0">
        <FieldLabel :for="field.name">标识色</FieldLabel>
        <div class="flex items-center gap-2">
          <input
            type="color"
            :value="field.state.value"
            class="border-input size-8 shrink-0 cursor-pointer rounded-md border bg-transparent"
            @input="field.handleChange(($event.target as HTMLInputElement).value)"
          />
          <Input
            :id="field.name"
            :model-value="field.state.value"
            class="font-mono"
            @update:model-value="field.handleChange(String($event))"
          />
        </div>
        <FieldError :errors="state.meta.errors" />
      </Field>
    </form.Field>

    <div class="flex items-center gap-2 pt-1">
      <Button type="submit" size="sm" :disabled="busy">
        {{ busy ? '保存中…' : submitLabel }}
      </Button>
      <Tip label="删除资产">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          class="text-destructive hover:text-destructive ml-auto"
          @click="emit('remove')"
        >
          <Trash2 />
        </Button>
      </Tip>
    </div>
  </form>
</template>
