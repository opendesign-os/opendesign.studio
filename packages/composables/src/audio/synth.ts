import type { FoleyKind } from '@opendesign/models'

type Graph = {
  context: AudioContext
  output: AudioNode
  start: number
  duration: number
}

type Color = 'white' | 'pink' | 'brown'

function noise(context: AudioContext, seconds: number, color: Color) {
  const length = Math.max(1, Math.ceil(context.sampleRate * seconds))
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const data = buffer.getChannelData(0)
  let brown = 0
  let b0 = 0
  let b1 = 0
  let b2 = 0
  for (let index = 0; index < length; index++) {
    const white = Math.random() * 2 - 1
    if (color === 'white') {
      data[index] = white * 0.5
    } else if (color === 'pink') {
      b0 = 0.99765 * b0 + white * 0.099046
      b1 = 0.963 * b1 + white * 0.2965164
      b2 = 0.57 * b2 + white * 1.0526913
      data[index] = (b0 + b1 + b2 + white * 0.1848) * 0.11
    } else {
      brown = (brown + 0.02 * white) / 1.02
      data[index] = brown * 3.5
    }
  }
  const source = context.createBufferSource()
  source.buffer = buffer
  return source
}

function filter(context: AudioContext, type: BiquadFilterType, frequency: number, q = 0.7) {
  const node = context.createBiquadFilter()
  node.type = type
  node.frequency.value = frequency
  node.Q.value = q
  return node
}

function swell(context: AudioContext, start: number, duration: number, level: number) {
  const gain = context.createGain()
  const fade = Math.min(0.4, duration / 3)
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(level, start + fade)
  gain.gain.setValueAtTime(level, start + duration - fade)
  gain.gain.linearRampToValueAtTime(0, start + duration)
  return gain
}

function bed(
  { context, output, start, duration }: Graph,
  color: Color,
  chain: AudioNode[],
  level: number,
) {
  const source = noise(context, duration, color)
  const gain = swell(context, start, duration, level)
  let node: AudioNode = source
  for (const next of chain) node = node.connect(next)
  node.connect(gain).connect(output)
  source.start(start)
  source.stop(start + duration)
  return source
}

function hit(
  { context, output }: Graph,
  at: number,
  frequency: number,
  drop: number,
  decay: number,
  level: number,
) {
  const tone = context.createOscillator()
  const gain = context.createGain()
  tone.frequency.setValueAtTime(frequency, at)
  tone.frequency.exponentialRampToValueAtTime(Math.max(20, frequency * drop), at + decay)
  gain.gain.setValueAtTime(level, at)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + decay)
  tone.connect(gain).connect(output)
  tone.start(at)
  tone.stop(at + decay + 0.02)
  return tone
}

function burst(
  { context, output }: Graph,
  at: number,
  type: BiquadFilterType,
  frequency: number,
  decay: number,
  level: number,
) {
  const source = noise(context, decay + 0.02, 'white')
  const gain = context.createGain()
  gain.gain.setValueAtTime(level, at)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + decay)
  source
    .connect(filter(context, type, frequency))
    .connect(gain)
    .connect(output)
  source.start(at)
  return source
}

function pulse(graph: Graph, every: number, beat: (at: number) => AudioScheduledSourceNode[]) {
  const sources: AudioScheduledSourceNode[] = []
  for (let at = graph.start; at < graph.start + graph.duration; at += every) {
    sources.push(...beat(at))
  }
  return sources
}

function drift(
  context: AudioContext,
  start: number,
  rate: number,
  depth: number,
  target: AudioParam,
) {
  const wave = context.createOscillator()
  const gain = context.createGain()
  wave.frequency.value = rate
  gain.gain.value = depth
  wave.connect(gain).connect(target)
  wave.start(start)
  return wave
}

const voices: Record<FoleyKind, (graph: Graph) => AudioScheduledSourceNode[]> = {
  rain: (graph) => [
    bed(
      graph,
      'white',
      [filter(graph.context, 'highpass', 900), filter(graph.context, 'lowpass', 6500)],
      0.35,
    ),
  ],
  wind: (graph) => {
    const lowpass = filter(graph.context, 'lowpass', 450)
    const wave = drift(graph.context, graph.start, 0.18, 260, lowpass.frequency)
    wave.stop(graph.start + graph.duration)
    return [bed(graph, 'brown', [lowpass], 0.7), wave]
  },
  crowd: (graph) => [
    bed(
      graph,
      'pink',
      [filter(graph.context, 'bandpass', 900, 0.6), filter(graph.context, 'lowpass', 2600)],
      0.9,
    ),
  ],
  train: (graph) => [
    bed(graph, 'brown', [filter(graph.context, 'lowpass', 280)], 0.9),
    ...pulse(graph, 0.32, (at) => [burst(graph, at, 'lowpass', 900, 0.08, 0.35)]),
  ],
  fire: (graph) => {
    const sources = [bed(graph, 'brown', [filter(graph.context, 'lowpass', 700)], 0.35)]
    for (let index = 0; index < graph.duration * 14; index++) {
      const at = graph.start + Math.random() * graph.duration
      sources.push(burst(graph, at, 'highpass', 2400, 0.015 + Math.random() * 0.03, 0.4))
    }
    return sources
  },
  water: (graph) => {
    const band = filter(graph.context, 'bandpass', 1400, 1.4)
    const wave = drift(graph.context, graph.start, 5, 500, band.frequency)
    wave.stop(graph.start + graph.duration)
    return [bed(graph, 'pink', [band], 0.9), wave]
  },
  footsteps: (graph) =>
    pulse(graph, 0.5, (at) => [
      burst(graph, at, 'lowpass', 520, 0.09, 0.9),
      hit(graph, at, 110, 0.5, 0.08, 0.5),
    ]),
  heartbeat: (graph) =>
    pulse(graph, 0.85, (at) => [
      hit(graph, at, 62, 0.65, 0.16, 1),
      hit(graph, at + 0.22, 56, 0.65, 0.14, 0.75),
    ]),
  door: (graph) => {
    const creak = graph.context.createOscillator()
    const gain = graph.context.createGain()
    const end = graph.start + Math.min(0.5, graph.duration)
    creak.type = 'sawtooth'
    creak.frequency.setValueAtTime(230, graph.start)
    creak.frequency.linearRampToValueAtTime(150, end)
    gain.gain.setValueAtTime(0.08, graph.start)
    gain.gain.linearRampToValueAtTime(0, end)
    creak
      .connect(filter(graph.context, 'bandpass', 1200, 6))
      .connect(gain)
      .connect(graph.output)
    creak.start(graph.start)
    creak.stop(end)
    const slam = Math.min(graph.start + graph.duration - 0.3, end)
    return [
      creak,
      hit(graph, slam, 95, 0.45, 0.28, 1),
      burst(graph, slam, 'lowpass', 1300, 0.18, 0.6),
    ]
  },
  glass: (graph) => {
    const sources: AudioScheduledSourceNode[] = [
      burst(graph, graph.start, 'highpass', 3400, 0.35, 0.8),
    ]
    for (let index = 0; index < 7; index++) {
      const at = graph.start + Math.random() * Math.min(0.5, graph.duration)
      sources.push(
        hit(graph, at, 2500 + Math.random() * 4000, 0.98, 0.25 + Math.random() * 0.3, 0.12),
      )
    }
    return sources
  },
  bell: (graph) =>
    [1, 2, 2.76, 4.07, 5.4].map((ratio, index) =>
      hit(
        graph,
        graph.start,
        523 * ratio,
        1,
        graph.duration / (1 + index * 0.35),
        0.4 / (index + 1),
      ),
    ),
  rumble: (graph) => {
    const tone = graph.context.createOscillator()
    const gain = swell(graph.context, graph.start, graph.duration, 0.5)
    tone.frequency.value = 46
    const wave = drift(graph.context, graph.start, 3, 8, tone.frequency)
    tone.connect(gain).connect(graph.output)
    tone.start(graph.start)
    tone.stop(graph.start + graph.duration)
    wave.stop(graph.start + graph.duration)
    return [tone, wave, bed(graph, 'brown', [filter(graph.context, 'lowpass', 140)], 0.6)]
  },
}

export function synthesize(
  context: AudioContext,
  output: AudioNode,
  kind: FoleyKind,
  duration: number,
) {
  const sources = voices[kind]({ context, output, start: context.currentTime + 0.02, duration })
  return () => {
    for (const source of sources) {
      source.onended = null
      source.stop()
      source.disconnect()
    }
  }
}
