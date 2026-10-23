import type { Emotion, Voice } from '@opendesign/models'

const profiles: Record<Voice, { female: boolean; pitch: number; rate: number }> = {
  'warm-male': { female: false, pitch: 0.95, rate: 1 },
  'bright-female': { female: true, pitch: 1.15, rate: 1.05 },
  'low-male': { female: false, pitch: 0.75, rate: 0.95 },
  'soft-female': { female: true, pitch: 1, rate: 0.95 },
  narrator: { female: false, pitch: 0.9, rate: 0.9 },
}

const moods: Record<Emotion, { pitch: number; rate: number; volume: number }> = {
  calm: { pitch: 1, rate: 1, volume: 1 },
  happy: { pitch: 1.1, rate: 1.08, volume: 1 },
  angry: { pitch: 1.05, rate: 1.15, volume: 1 },
  sad: { pitch: 0.9, rate: 0.88, volume: 0.85 },
  tense: { pitch: 1.02, rate: 1.1, volume: 0.95 },
  whisper: { pitch: 0.95, rate: 0.9, volume: 0.55 },
}

const FEMALE =
  /female|女|xiaoxiao|xiaoyi|xiaohan|xiaomo|xiaorui|huihui|yaoyao|tingting|meijia|hiugaai|hsiaochen/i
const MALE = /male|男|yunxi|yunyang|yunjian|yunze|kangkang|zhiwei|wanlung/i

const CHARS_PER_SECOND = 4.5

function supported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pick(female: boolean) {
  const voices = speechSynthesis.getVoices().filter((voice) => /^zh/i.test(voice.lang))
  const match = voices.find((voice) =>
    female ? FEMALE.test(voice.name) : MALE.test(voice.name) && !FEMALE.test(voice.name),
  )
  return match ?? voices[0]
}

export type Speech = {
  voice?: Voice
  emotion?: Emotion
  duration: number
  rate: number
  volume: number
}

export function speak(text: string, options: Speech) {
  if (!supported() || !text.trim()) return
  const profile = profiles[options.voice ?? 'narrator']
  const mood = moods[options.emotion ?? 'calm']
  const utterance = new SpeechSynthesisUtterance(text)
  const voice = pick(profile.female)
  utterance.lang = 'zh-CN'
  if (voice) utterance.voice = voice
  const natural = Math.max(text.length / CHARS_PER_SECOND, 0.4)
  const fit = Math.min(1.6, Math.max(0.75, natural / Math.max(options.duration, 0.3)))
  utterance.rate = Math.min(2, Math.max(0.5, fit * profile.rate * mood.rate * options.rate))
  utterance.pitch = Math.min(2, Math.max(0, profile.pitch * mood.pitch))
  utterance.volume = Math.min(1, Math.max(0, options.volume * mood.volume))
  speechSynthesis.cancel()
  speechSynthesis.speak(utterance)
}

export function hush() {
  if (supported()) speechSynthesis.cancel()
}

export function prime() {
  if (supported()) speechSynthesis.getVoices()
}
