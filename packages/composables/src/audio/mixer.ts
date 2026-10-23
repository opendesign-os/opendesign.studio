import type { Emotion, FoleyKind, Voice } from '@opendesign/models'
import { type MaybeRefOrGetter, onScopeDispose, type Ref, toValue, watch } from 'vue'
import { hush, prime, speak } from './speech'
import { synthesize } from './synth'

export type Cue = { id: string; start: number; duration: number } & (
  | { kind: 'voice'; text: string; voice?: Voice; emotion?: Emotion }
  | { kind: 'sound'; sound: FoleyKind }
)

export type Mixer = {
  cues: MaybeRefOrGetter<Cue[]>
  time: Ref<number>
  playing: Ref<boolean>
  rate: MaybeRefOrGetter<number>
  volume: MaybeRefOrGetter<number>
}

const JUMP = 0.5
const LATE = 0.25

export function useMixer(options: Mixer) {
  let context: AudioContext | null = null
  let master: GainNode | null = null
  let audition: (() => void) | null = null
  let last = 0
  const active = new Map<string, () => void>()
  const fired = new Set<string>()

  prime()

  function bus() {
    if (!context || !master) {
      context = new AudioContext()
      master = context.createGain()
      master.connect(context.destination)
    }
    if (context.state === 'suspended') void context.resume()
    master.gain.value = toValue(options.volume)
    return { context, master }
  }

  function play(cue: Cue, offset: number) {
    const rate = toValue(options.rate)
    const remaining = (cue.duration - offset) / rate
    if (remaining <= 0.05) return null
    if (cue.kind === 'voice') {
      const volume = toValue(options.volume)
      if (volume > 0) {
        speak(cue.text, {
          voice: cue.voice,
          emotion: cue.emotion,
          duration: remaining,
          rate,
          volume,
        })
      }
      return null
    }
    const { context, master } = bus()
    return synthesize(context, master, cue.sound, remaining)
  }

  function trigger(cue: Cue, offset: number) {
    fired.add(cue.id)
    const stop = play(cue, offset)
    if (stop) active.set(cue.id, stop)
  }

  function halt() {
    for (const stop of active.values()) stop()
    active.clear()
    fired.clear()
    hush()
  }

  function resume(at: number) {
    halt()
    last = at
    for (const cue of toValue(options.cues)) {
      const offset = at - cue.start
      if (offset < 0 || offset >= cue.duration) continue
      if (cue.kind === 'sound' || offset < LATE) trigger(cue, offset)
      else fired.add(cue.id)
    }
  }

  watch(options.playing, (value) => (value ? resume(options.time.value) : halt()))

  watch(options.time, (now) => {
    if (!options.playing.value) return
    if (now < last || now - last > JUMP) {
      resume(now)
      return
    }
    for (const cue of toValue(options.cues)) {
      if (!fired.has(cue.id) && cue.start >= last && cue.start < now) trigger(cue, now - cue.start)
    }
    last = now
  })

  watch(
    () => toValue(options.volume),
    (value) => {
      if (context && master) master.gain.setTargetAtTime(value, context.currentTime, 0.02)
    },
  )

  function preview(cue: Cue) {
    audition?.()
    hush()
    audition = play(cue, 0)
  }

  onScopeDispose(() => {
    halt()
    audition?.()
    void context?.close()
  })

  return { preview }
}
