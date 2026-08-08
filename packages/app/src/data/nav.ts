import {
  Bot,
  Building2,
  FolderClosed,
  MessageSquare,
  Plus,
  Search,
  SlidersHorizontal,
  SquareCheckBig,
} from '@lucide/vue'

export const actions = [
  { id: 'new-chat', label: 'New chat', icon: Plus },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'customize', label: 'Customize', icon: SlidersHorizontal },
]

export const sections = [
  { path: '/', label: 'Chats', icon: MessageSquare },
  { path: '/projects', label: 'Projects', icon: FolderClosed },
  { path: '/tasks', label: 'Tasks', icon: SquareCheckBig },
  { path: '/agents', label: 'Agents', icon: Bot },
  { path: '/companies', label: 'Companies', icon: Building2 },
] as const

export const workspaces = [
  { id: 'chats', label: 'Chats', path: '/' },
  { id: 'colab', label: 'Colab', path: '/colab' },
  { id: 'code', label: 'Code', path: '/code' },
] as const

export const recents = [
  {
    id: 'neural-architecture-analysis',
    title: 'Neural architecture analysis',
    summary: 'Comparing transformer variants for seq…',
  },
  {
    id: 'build-a-react-dashboard',
    title: 'Build a React dashboard',
    summary: 'Full analytics dashboard with real-time…',
  },
  {
    id: 'explain-quantum-entanglement',
    title: 'Explain quantum entanglement',
    summary: 'A simplified explanation for software en…',
  },
  {
    id: 'product-copy-generator',
    title: 'Product copy generator',
    summary: 'AI-powered marketing copy for SaaS…',
  },
  {
    id: 'analyze-my-design-aesthetic',
    title: 'Analyze my design aesthetic',
    summary: 'Visual analysis and recommendations…',
  },
]

export const account = {
  name: 'Lukas',
  email: 'lukas@axiom.ai',
  initial: 'L',
  plan: 'Pro Plan',
  model: 'Axiom Ultra 3.1',
}
