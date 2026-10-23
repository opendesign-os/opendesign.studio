function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function clock(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds))
  return `${pad(Math.floor(whole / 60))}:${pad(whole % 60)}`
}

export function timecode(seconds: number, fps = 30) {
  const whole = Math.max(0, Math.floor(seconds))
  const frames = Math.floor((seconds - whole) * fps)
  return [Math.floor(whole / 60), whole % 60, frames].map(pad).join(':')
}

export function duration(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m${pad(seconds % 60)}s`
}
