<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { ProviderCard, VendorCard } from '@opendesign/components'
import type { Preset } from '@opendesign/models'
import { draft, preset, presets, protocolLabel } from '@opendesign/models'
import {
  reason,
  useCreateVendor,
  useModels,
  usePatchProvider,
  usePatchVendor,
  useProviders,
  useRemoveVendor,
  useVendors,
} from '@opendesign/queries'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Skeleton,
} from '@opendesign/shadcn'
import { computed, ref } from 'vue'

const { data: vendors, isPending: loading } = useVendors()
const { data: providers, isPending } = useProviders()
const models = useModels(vendors)
const create = useCreateVendor()
const edit = usePatchVendor()
const remove = useRemoveVendor()
const patch = usePatchProvider()
const added = ref<string>()

const catalogs = computed(
  () => new Map((vendors.value ?? []).map((vendor, index) => [vendor.id, models.value[index]])),
)

function catalog(id?: string) {
  const result = id ? catalogs.value.get(id) : undefined
  return {
    models: result?.data ?? [],
    pending: result?.isFetching ?? false,
    error: result?.error ? reason(result.error) : undefined,
  }
}

function add(name?: Preset) {
  create.mutate(draft(name), {
    onSuccess: (vendor) => {
      added.value = vendor.id
    },
  })
}
</script>

<template>
  <div class="space-y-8 p-6">
    <section class="space-y-2">
      <div class="flex items-end justify-between gap-4 pb-1">
        <div>
          <h3 class="text-data font-medium">厂商</h3>
          <p class="text-muted-foreground mt-0.5 text-micro">
            团队共用的接入账号，填好密钥后自动拉取可用模型
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm" :disabled="create.isPending.value">
              <Plus />
              添加厂商
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuItem v-for="name in preset.options" :key="name" @select="add(name)">
              {{ presets[name].name }}
              <span class="text-muted-foreground ml-auto text-micro">
                {{ protocolLabel[presets[name].protocol] }}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @select="add()">自定义厂商</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Skeleton v-if="loading" class="h-16 rounded-xl" />
      <p
        v-else-if="!vendors?.length"
        class="border-border text-muted-foreground rounded-xl border border-dashed px-4 py-6 text-center text-meta"
      >
        还没有厂商。添加一个并填入密钥，就能拉取它提供的模型
      </p>
      <VendorCard
        v-for="vendor in vendors"
        v-else
        :key="vendor.id"
        :vendor="vendor"
        v-bind="catalog(vendor.id)"
        :default-open="vendor.id === added"
        @patch="edit.mutate({ id: vendor.id, patch: $event })"
        @remove="remove.mutate(vendor.id)"
        @refresh="catalogs.get(vendor.id)?.refetch()"
      />
    </section>

    <section class="space-y-2">
      <div class="pb-1">
        <h3 class="text-data font-medium">能力</h3>
        <p class="text-muted-foreground mt-0.5 text-micro">
          每类生成任务用哪家厂商的哪个模型，以及生成参数与调度
        </p>
      </div>
      <template v-if="isPending">
        <Skeleton v-for="index in 4" :key="index" class="h-16 rounded-xl" />
      </template>
      <ProviderCard
        v-for="provider in providers"
        v-else
        :key="provider.id"
        :provider="provider"
        :vendors="vendors ?? []"
        v-bind="catalog(provider.vendorId)"
        @patch="patch.mutate({ id: provider.id, patch: $event })"
      />
    </section>
  </div>
</template>
