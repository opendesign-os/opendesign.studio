<script setup lang="ts">
import type { SeriesDraft } from '@opendesign/models'
import { seriesDraft } from '@opendesign/models'
import { Button, Field, FieldError, FieldLabel, Input, Textarea } from '@opendesign/shadcn'
import { useForm } from '@tanstack/vue-form'
import Format from './Format.vue'

defineProps<{ busy: boolean }>()
const emit = defineEmits<{ submit: [draft: SeriesDraft] }>()

const blank: SeriesDraft = { title: '', aspect: '9:16', synopsis: '' }

const form = useForm({
  defaultValues: blank,
  validators: { onChange: seriesDraft },
  onSubmit: ({ value }) => emit('submit', value),
})
</script>

<template>
  <form class="space-y-4" @submit.prevent="form.handleSubmit()">
    <form.Field v-slot="{ field, state }" name="title">
      <Field :data-invalid="state.meta.errors.length > 0">
        <FieldLabel :for="field.name">剧名</FieldLabel>
        <Input
          :id="field.name"
          :model-value="field.state.value"
          placeholder="夜色归途"
          @update:model-value="field.handleChange(String($event))"
          @blur="field.handleBlur"
        />
        <FieldError :errors="state.meta.errors" />
      </Field>
    </form.Field>

    <form.Field v-slot="{ field }" name="aspect">
      <Field>
        <FieldLabel>画幅</FieldLabel>
        <div class="flex">
          <Format :model-value="field.state.value" @update:model-value="field.handleChange" />
        </div>
      </Field>
    </form.Field>

    <form.Field v-slot="{ field, state }" name="synopsis">
      <Field :data-invalid="state.meta.errors.length > 0">
        <FieldLabel :for="field.name">一句话梗概</FieldLabel>
        <Textarea
          :id="field.name"
          :model-value="field.state.value"
          rows="3"
          class="leading-relaxed"
          placeholder="末班地铁停运那夜，她意外卷进一桩十年前的旧案"
          @update:model-value="field.handleChange(String($event))"
          @blur="field.handleBlur"
        />
        <FieldError :errors="state.meta.errors" />
      </Field>
    </form.Field>

    <Button type="submit" size="sm" :disabled="busy">{{ busy ? '创建中…' : '创建' }}</Button>
  </form>
</template>
