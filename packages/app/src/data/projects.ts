export type ProjectStatus = 'Stable' | 'Active'

export type Project = {
  name: string
  description: string
  language: string
  files: number
  lines: number
  branch: string
  updated: string
  status: ProjectStatus
  fill: number
}

export const languageTone: Record<string, string> = {
  TypeScript: 'text-chart-3 bg-chart-3/12',
  Python: 'text-chart-2 bg-chart-2/12',
  SQL: 'text-chart-1 bg-chart-1/12',
  Shell: 'text-chart-5 bg-chart-5/12',
  Go: 'text-chart-2 bg-chart-2/12',
}

export const projects: Project[] = [
  {
    name: 'axiom-api-client',
    description:
      'Type-safe API client with streaming, retries and rate limiting for Axiom Ultra 3.1',
    language: 'TypeScript',
    files: 6,
    lines: 312,
    branch: 'main',
    updated: '1h ago',
    status: 'Stable',
    fill: 1,
  },
  {
    name: 'data-pipeline',
    description: 'Async ETL pipeline for processing and embedding large document corpora',
    language: 'Python',
    files: 9,
    lines: 487,
    branch: 'dev',
    updated: '4h ago',
    status: 'Active',
    fill: 0.6,
  },
  {
    name: 'analytics-queries',
    description: 'Optimised SQL views and materialized tables for real-time usage analytics',
    language: 'SQL',
    files: 4,
    lines: 218,
    branch: 'main',
    updated: '2d ago',
    status: 'Stable',
    fill: 0.85,
  },
  {
    name: 'infra-deploy',
    description: 'Bash & Terraform scripts for zero-downtime blue/green deployments on AWS',
    language: 'Shell',
    files: 7,
    lines: 391,
    branch: 'main',
    updated: '3d ago',
    status: 'Stable',
    fill: 0.73,
  },
  {
    name: 'gateway-service',
    description: 'High-throughput Go microservice handling auth, routing and load-shedding',
    language: 'Go',
    files: 14,
    lines: 891,
    branch: 'feature/tracing',
    updated: '1w ago',
    status: 'Active',
    fill: 0.44,
  },
  {
    name: 'ui-component-library',
    description:
      'Reusable React component system with Storybook, accessibility audits and design tokens',
    language: 'TypeScript',
    files: 38,
    lines: 2412,
    branch: 'main',
    updated: '2w ago',
    status: 'Stable',
    fill: 0.92,
  },
  {
    name: 'eval-harness',
    description: 'Reproducible benchmark runner scoring model checkpoints against golden datasets',
    language: 'Python',
    files: 11,
    lines: 634,
    branch: 'main',
    updated: '3w ago',
    status: 'Stable',
    fill: 0.68,
  },
  {
    name: 'usage-reporter',
    description: 'Nightly job aggregating token spend per workspace into billing-ready summaries',
    language: 'SQL',
    files: 5,
    lines: 176,
    branch: 'main',
    updated: '1mo ago',
    status: 'Active',
    fill: 0.31,
  },
]
