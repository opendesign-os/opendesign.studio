<script setup lang="ts">
import type { ShotDraft } from '@opendesign/models'
import { shotDraft, shotSizeLabel } from '@opendesign/models'
import { Button, Field, FieldError, FieldLabel, Input, Textarea } from '@opendesign/shadcn'
import { useForm } from '@tanstack/vue-form'
import Picker from '../form/Picker.vue'

const props = defineProps<{ value: ShotDraft; busy: boolean }>()
const emit = defineEmits<{ submit: [draft: ShotDraft] }>()

const form = useForm({
  defaultValues: { ...props.value },
  validators: { onChange: shotDraft },
  onSubmit: ({ value }) => emit('submit', value),
})
</script>

<template>
  <form class="space-y-3" @submit.prevent="form.handleSubmit()">
    <div class="grid gap-2 @2xs:grid-cols-[1fr_6rem]">
      <form.Field v-slot="{ field }" name="scene">
        <Field>
          <FieldLabel :for="field.name">场次</FieldLabel>
          <Input
            :id="field.name"
            :model-value="field.state.value"
            @update:model-value="field.handleChange(String($event))"
          />
        </Field>
      </form.Field>

      <form.Field v-slot="{ field }" name="size">
        <Field>
          <FieldLabel>景别</FieldLabel>
          <Picker
            :model-value="field.state.value"
            :options="shotSizeLabel"
            @update:model-value="field.handleChange"
          />
        </Field>
      </form.Field>
    </div>

    <form.Field v-slot="{ field, state }" name="prompt">
      <Field :data-invalid="state.meta.errors.length > 0">
        <FieldLabel :for="field.name">画面描述</FieldLabel>
        <Textarea
          :id="field.name"
          :model-value="field.state.value"
          rows="5"
          class="leading-relaxed"
          @update:model-value="field.handleChange(String($event))"
        />
        <FieldError :errors="state.meta.errors" />
      </Field>
    </form.Field>

    <form.Field v-slot="{ field }" name="note">
      <Field>
        <FieldLabel :for="field.name">备注</FieldLabel>
        <Input
          :id="field.name"
          :model-value="field.state.value"
          placeholder="重生成原因、待确认的点……"
          @update:model-value="field.handleChange(String($event))"
        />
      </Field>
    </form.Field>

    <Button type="submit" size="sm" class="w-full" :disabled="busy">
      {{ busy ? '保存中…' : '保存镜头' }}
    </Button>
  </form>
</template>
