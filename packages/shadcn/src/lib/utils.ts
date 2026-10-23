import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const merge = extendTailwindMerge({
  extend: { theme: { text: ['micro', 'meta', 'data', 'body', 'title'] } },
})

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs))
}
