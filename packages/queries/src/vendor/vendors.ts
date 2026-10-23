import type { Model, Vendor, VendorDraft, VendorPatch } from '@opendesign/models'
import { useMutation, useQueries, useQuery } from '@tanstack/vue-query'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { api } from '../common/api'
import { keys, useInvalidate, usePatch } from '../common/cache'

const FRESH = 10 * 60_000

export function useVendors() {
  return useQuery({ queryKey: keys.vendors, queryFn: () => api<Vendor[]>('vendors') })
}

export function useCreateVendor() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (draft: VendorDraft) => api<Vendor>('vendors', { method: 'POST', body: draft }),
    onSuccess: () => invalidate(keys.vendors),
  })
}

export function usePatchVendor() {
  return usePatch({
    name: 'vendor',
    scopes: [keys.vendors],
    request: (id, patch: VendorPatch) =>
      api<Vendor>(`vendors/${id}`, { method: 'PATCH', body: patch }),
    affects: (vendor) => [keys.models(vendor.id)],
  })
}

export function useRemoveVendor() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => api<Vendor>(`vendors/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidate(keys.vendors, keys.providers),
  })
}

export function useModels(vendors: MaybeRefOrGetter<Vendor[] | undefined>) {
  return useQueries({
    queries: () =>
      (toValue(vendors) ?? []).map((vendor) => ({
        queryKey: keys.models(vendor.id),
        queryFn: () => api<Model[]>(`vendors/${vendor.id}/models`),
        enabled: Boolean(vendor.endpoint && vendor.key),
        staleTime: FRESH,
        retry: false,
      })),
  })
}
