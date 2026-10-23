import type { Shot, ShotPatch } from '@opendesign/models'
import { computed, shallowRef } from 'vue'

type Change = { id: string; before: ShotPatch; after: ShotPatch; at: number }

const MERGE = 800
const LIMIT = 50

function same(a: string[], b: string[]) {
  return a.length === b.length && a.every((key) => b.includes(key))
}

export function useHistory(
  read: (id: string) => Shot | undefined,
  apply: (id: string, patch: ShotPatch) => void,
) {
  const past = shallowRef<Change[]>([])
  const future = shallowRef<Change[]>([])
  let sealed = false

  function record(id: string, patch: ShotPatch) {
    const shot = read(id)
    if (!shot) return
    const fields = Object.keys(patch) as (keyof ShotPatch)[]
    const last = past.value.at(-1)
    const now = Date.now()

    if (
      !sealed &&
      last?.id === id &&
      now - last.at < MERGE &&
      same(fields, Object.keys(last.after))
    ) {
      past.value = [...past.value.slice(0, -1), { ...last, after: patch, at: now }]
    } else {
      const before = Object.fromEntries(fields.map((key) => [key, shot[key]])) as ShotPatch
      past.value = [...past.value.slice(-(LIMIT - 1)), { id, before, after: patch, at: now }]
    }

    sealed = false
    future.value = []
    apply(id, patch)
  }

  function undo() {
    const change = past.value.at(-1)
    if (!change) return
    past.value = past.value.slice(0, -1)
    future.value = [...future.value, change]
    sealed = true
    apply(change.id, change.before)
  }

  function redo() {
    const change = future.value.at(-1)
    if (!change) return
    future.value = future.value.slice(0, -1)
    past.value = [...past.value, change]
    sealed = true
    apply(change.id, change.after)
  }

  function clear() {
    past.value = []
    future.value = []
    sealed = true
  }

  return {
    record,
    undo,
    redo,
    clear,
    canUndo: computed(() => past.value.length > 0),
    canRedo: computed(() => future.value.length > 0),
  }
}
