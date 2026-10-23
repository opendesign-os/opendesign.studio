<script setup lang="ts">
import { auth } from '@opendesign/queries'
import { Button, Field, FieldError, FieldLabel, Input } from '@opendesign/shadcn'
import { useForm } from '@tanstack/vue-form'
import { useQueryClient } from '@tanstack/vue-query'
import { ref } from 'vue'
import { z } from 'zod'

const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: '邮箱或密码不正确',
  USER_ALREADY_EXISTS: '这个邮箱已经注册过了',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: '这个邮箱已经注册过了',
}

const account = z.object({
  name: z.string().trim().max(30, '昵称最多 30 个字'),
  email: z.email('邮箱格式不正确'),
  password: z.string().min(8, '密码至少 8 位'),
})

const mode = ref<'in' | 'up'>('in')
const failure = ref('')
const client = useQueryClient()

const form = useForm({
  defaultValues: { name: '', email: '', password: '' },
  validators: { onSubmit: account },
  onSubmit: async ({ value }) => {
    failure.value = ''
    const { error } =
      mode.value === 'in'
        ? await auth.signIn.email({ email: value.email, password: value.password })
        : await auth.signUp.email({
            name: value.name || value.email.split('@')[0] || value.email,
            email: value.email,
            password: value.password,
          })
    if (error) {
      failure.value = (error.code && messages[error.code]) || error.message || '登录失败'
      return
    }
    client.clear()
  },
})

function toggle() {
  mode.value = mode.value === 'in' ? 'up' : 'in'
  failure.value = ''
}
</script>

<template>
  <div class="flex h-full items-center justify-center p-6">
    <form
      class="border-border bg-card w-full max-w-sm space-y-4 rounded-xl border p-6"
      @submit.prevent="form.handleSubmit()"
    >
      <div class="flex items-center gap-2.5">
        <span
          class="bg-foreground text-background text-meta flex size-7 shrink-0 items-center justify-center rounded-md font-bold"
        >
          镜
        </span>
        <div>
          <h1 class="text-body font-semibold">{{ mode === 'in' ? '登录' : '注册账号' }}</h1>
          <p class="text-muted-foreground text-meta">注册后会自动创建你的团队</p>
        </div>
      </div>

      <form.Field v-if="mode === 'up'" v-slot="{ field, state }" name="name">
        <Field :data-invalid="state.meta.errors.length > 0">
          <FieldLabel :for="field.name">昵称</FieldLabel>
          <Input
            :id="field.name"
            :model-value="field.state.value"
            autocomplete="nickname"
            @update:model-value="field.handleChange(String($event))"
          />
          <FieldError :errors="state.meta.errors" />
        </Field>
      </form.Field>

      <form.Field v-slot="{ field, state }" name="email">
        <Field :data-invalid="state.meta.errors.length > 0">
          <FieldLabel :for="field.name">邮箱</FieldLabel>
          <Input
            :id="field.name"
            :model-value="field.state.value"
            type="email"
            autocomplete="email"
            @update:model-value="field.handleChange(String($event))"
          />
          <FieldError :errors="state.meta.errors" />
        </Field>
      </form.Field>

      <form.Field v-slot="{ field, state }" name="password">
        <Field :data-invalid="state.meta.errors.length > 0">
          <FieldLabel :for="field.name">密码</FieldLabel>
          <Input
            :id="field.name"
            :model-value="field.state.value"
            type="password"
            :autocomplete="mode === 'in' ? 'current-password' : 'new-password'"
            @update:model-value="field.handleChange(String($event))"
          />
          <FieldError :errors="state.meta.errors" />
        </Field>
      </form.Field>

      <p v-if="failure" class="text-destructive text-meta">{{ failure }}</p>

      <form.Subscribe v-slot="busy" :selector="(state) => state.isSubmitting">
        <Button type="submit" class="w-full" :disabled="busy">
          {{ busy ? '请稍候…' : mode === 'in' ? '登录' : '注册' }}
        </Button>
      </form.Subscribe>

      <p class="text-muted-foreground text-center text-meta">
        {{ mode === 'in' ? '还没有账号？' : '已经有账号？' }}
        <button type="button" class="text-primary hover:underline" @click="toggle">
          {{ mode === 'in' ? '注册' : '去登录' }}
        </button>
      </p>
    </form>
  </div>
</template>
