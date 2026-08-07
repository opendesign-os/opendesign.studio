import { House } from '@lucide/vue'

export const menu = [{ path: '/', label: '首页', icon: House }] as const

export type MenuItem = (typeof menu)[number]
