import { computed, shallowRef } from 'vue'

type Change<P> = { id: string; before: P; after: P; at: number }

export type History<P> = {
  read: (id: string) => P | undefined
  apply: (id: string, patch: P) => void
}

const MERGE = 800
const LIMIT = 50

function same(a: string[], b: string[]) {
  return a.length === b.length && a.every((key) => b.includes(key))
}

export function useHistory<P extends object>({ read, apply }: History<P>) {
  const past = shallowRef<Change<P>[]>([])
  const future = shallowRef<Change<P>[]>([])
  let sealed = false

  function record(id: string, patch: P) {
    const current = read(id)
    if (!current) return
    const fields = Object.keys(patch)
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
      const before = Object.fromEntries(fields.map((key) => [key, current[key as keyof P]])) as P
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
