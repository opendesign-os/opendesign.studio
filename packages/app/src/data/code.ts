import type { FileNode } from '@opendesign/components'

export const repository = 'axiom-api-client'

export const tree: FileNode[] = [
  {
    name: 'src',
    path: 'src',
    kind: 'dir',
    children: [
      { name: 'client.ts', path: 'src/client.ts', kind: 'file' },
      { name: 'factory.ts', path: 'src/factory.ts', kind: 'file' },
      { name: 'rate-limiter.ts', path: 'src/rate-limiter.ts', kind: 'file' },
      { name: 'types.ts', path: 'src/types.ts', kind: 'file' },
      { name: 'utils.ts', path: 'src/utils.ts', kind: 'file' },
    ],
  },
  { name: 'index.ts', path: 'index.ts', kind: 'file' },
  { name: 'package.json', path: 'package.json', kind: 'file' },
  { name: 'tsconfig.json', path: 'tsconfig.json', kind: 'file' },
  { name: 'README.md', path: 'README.md', kind: 'file' },
]

export type Source = {
  path: string
  name: string
  language: string
  code: string
}

const client = `import type { AxiomConfig, RequestOptions, StreamEvent } from "./types";
import { buildHeaders, handleError, parseStreamChunk } from "./utils";
import { RateLimiter } from "./rate-limiter";

/**
 * AxiomClient — Production-ready API client for Axiom Ultra 3.1
 * Supports streaming, retries, rate limiting and full TypeScript coverage.
 */
export class AxiomClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly rateLimiter: RateLimiter;
  private readonly maxRetries: number;

  constructor(private readonly config: AxiomConfig) {
    this.baseUrl = config.baseUrl ?? "https://api.axiom.ai/v3";
    this.apiKey = config.apiKey;
    this.maxRetries = config.maxRetries ?? 3;
    this.rateLimiter = new RateLimiter({
      requestsPerMinute: config.rateLimit ?? 60,
    });
  }

  // ── Completion ───────────────────────────────
  async complete(
    prompt: string,
    options: RequestOptions = {}
  ): Promise<string> {
    const response = await this.request("/complete", {
      method: "POST",
      body: JSON.stringify({
        model: options.model ?? "axiom-ultra-3.1",
        prompt,
        temperature: options.temperature ?? 0.72,
        max_tokens: options.maxTokens ?? 4096,
        stream: false,
      }),
    });

    return response.text;
  }

  // ── Streaming ────────────────────────────────
  async *stream(
    prompt: string,
    options: RequestOptions = {}
  ): AsyncGenerator<StreamEvent> {
    const response = await this.request("/complete", {
      method: "POST",
      body: JSON.stringify({
        model: options.model ?? "axiom-ultra-3.1",
        prompt,
        temperature: options.temperature ?? 0.72,
        max_tokens: options.maxTokens ?? 4096,
        stream: true,
      }),
      raw: true,
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      for (const chunk of decoder.decode(value).split("\\n\\n")) {
        const event = parseStreamChunk(chunk);
        if (event) yield event;
      }
    }
  }

  // ── Transport ────────────────────────────────
  private async request(path: string, init: RequestInit & { raw?: boolean } = {}) {
    await this.rateLimiter.acquire();

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const response = await fetch(this.baseUrl + path, {
        ...init,
        headers: buildHeaders(this.apiKey, init.headers),
      });

      if (response.status === 429) {
        await this.rateLimiter.backoff(attempt);
        continue;
      }

      if (!response.ok) throw await handleError(response);

      return init.raw ? response : await response.json();
    }

    throw new Error("Retry budget exhausted");
  }
}
`

const types = `export type AxiomConfig = {
  apiKey: string;
  baseUrl?: string;
  maxRetries?: number;
  rateLimit?: number;
};

export type RequestOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
};

export type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "usage"; inputTokens: number; outputTokens: number }
  | { type: "done"; reason: "stop" | "length" | "cancelled" };
`

const index = `export { AxiomClient } from "./src/client";
export { createClient } from "./src/factory";
export { RateLimiter } from "./src/rate-limiter";

export type {
  AxiomConfig,
  RequestOptions,
  StreamEvent,
} from "./src/types";
`

export const sources: Record<string, Source> = {
  'src/client.ts': {
    path: 'src/client.ts',
    name: 'client.ts',
    language: 'typescript',
    code: client,
  },
  'src/types.ts': {
    path: 'src/types.ts',
    name: 'types.ts',
    language: 'typescript',
    code: types,
  },
  'index.ts': {
    path: 'index.ts',
    name: 'index.ts',
    language: 'typescript',
    code: index,
  },
}

export const openTabs = ['src/client.ts', 'src/types.ts', 'index.ts']
