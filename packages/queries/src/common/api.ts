import { FetchError, ofetch } from 'ofetch'

export { FetchError }

export const api = ofetch.create({ baseURL: '/api' })

export function media(key: string) {
  return `/api/media/${key}`
}

export function reason(error: unknown) {
  const message = error instanceof FetchError ? error.data?.message : undefined
  if (typeof message === 'string') return message
  return error instanceof Error ? error.message : String(error)
}
