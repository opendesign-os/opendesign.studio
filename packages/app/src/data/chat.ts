import { Code2, FileText, Globe, Zap } from '@lucide/vue'
import type { Block } from '@opendesign/components'

export const quickStart = [
  {
    id: 'write-a-script',
    title: 'Write a script',
    prompt: 'Write a TypeScript script that fetches data from an API and processes it.',
    icon: Code2,
  },
  {
    id: 'analyze-document',
    title: 'Analyze document',
    prompt: 'Analyze this document and provide a comprehensive summary with key insights.',
    icon: FileText,
  },
  {
    id: 'brainstorm-ideas',
    title: 'Brainstorm ideas',
    prompt: 'Brainstorm 10 innovative product ideas for AI-powered tools in 2025.',
    icon: Zap,
  },
  {
    id: 'research-topic',
    title: 'Research topic',
    prompt: 'Provide a comprehensive research overview on quantum computing and its applications.',
    icon: Globe,
  },
]

export type Message = {
  id: string
  role: 'user' | 'assistant'
  blocks: Block[]
}

function text(value: string): Block {
  return { kind: 'paragraph', spans: [{ text: value }] }
}

function lead(label: string, value: string): Block {
  return { kind: 'paragraph', spans: [{ text: label, strong: true }, { text: value }] }
}

export const conversation: Message[] = [
  {
    id: 'ask',
    role: 'user',
    blocks: [
      text(
        "Explain quantum entanglement in simple terms. I'm a software engineer, not a physicist — skip the maths where you can.",
      ),
    ],
  },
  {
    id: 'answer',
    role: 'assistant',
    blocks: [
      { kind: 'heading', text: 'What Entanglement Actually Is' },
      text(
        'Two particles are entangled when they can no longer be described independently. Instead of one state per particle, there is a single shared state covering both. Nothing travels between them — the description was never separable to begin with.',
      ),
      lead(
        'The closest software analogy ',
        'is a pair of values produced by one computation and stored in one object. Reading a field does not send a message to the other field; both were determined by the same allocation.',
      ),
      { kind: 'divider' },
      { kind: 'heading', text: 'Real-World Applications' },
      lead(
        '1. Quantum Key Distribution (QKD) ',
        'Entanglement enables cryptographic key exchange where any eavesdropping physically disturbs the particles and is detectable. BB84 and E91 protocols are already deployed commercially.',
      ),
      lead(
        '2. Quantum Computing ',
        "Entangled qubits are the foundation of quantum speedup. Algorithms like Shor's (factoring) and Grover's (search) exploit entanglement to explore exponentially many states simultaneously.",
      ),
      lead(
        '3. Quantum Teleportation ',
        'Not sci-fi teleportation — but the exact quantum state of a particle can be reconstructed at a remote location by combining entanglement with a classical message. The original is destroyed in the process (no cloning).',
      ),
      lead(
        '4. Quantum Sensing ',
        'Entangled particles can measure gravitational fields, magnetic anomalies, and time with precision far beyond classical instruments. GPS accuracy improvements are one near-term target.',
      ),
      { kind: 'divider' },
      { kind: 'heading', text: 'The Bottom Line' },
      {
        kind: 'paragraph',
        spans: [
          { text: 'Entanglement means: ' },
          {
            text: 'two particles share a single quantum description, and measuring one instantly completes the description of both',
            strong: true,
          },
          {
            text: ", regardless of separation. It's not telepathy, not FTL communication — it's a deep structural feature of how information is encoded in the universe at the quantum level.",
          },
        ],
      },
      {
        kind: 'paragraph',
        spans: [
          { text: 'For a software engineer: think of it as a ' },
          { text: 'non-local constraint', strong: true },
          {
            text: ' baked into the fabric of reality. The universe enforces correlation at the moment of observation, with no underlying mechanism we can inspect or exploit for classical communication.',
          },
        ],
      },
      text(
        "That's what makes it both useless for science fiction and profoundly revolutionary for computing.",
      ),
    ],
  },
]
