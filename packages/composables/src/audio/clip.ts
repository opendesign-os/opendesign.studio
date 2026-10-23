export function clip(src: string, offset: number, rate: number, volume: number) {
  const element = new Audio(src)
  element.playbackRate = rate
  element.volume = volume
  element.addEventListener(
    'loadedmetadata',
    () => {
      element.currentTime = offset
      void element.play()
    },
    { once: true },
  )
  return () => {
    element.pause()
    element.removeAttribute('src')
  }
}
