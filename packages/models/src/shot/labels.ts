import type {
  Camera,
  Easing,
  Emotion,
  Plane,
  ShotSize,
  ShotStatus,
  Slot,
  Transition,
} from './schema'

export const shotSizeLabel: Record<ShotSize, string> = {
  wide: '远景',
  medium: '中景',
  close: '近景',
  macro: '特写',
}

export const cameraLabel: Record<Camera, string> = {
  static: '固定',
  push: '推',
  pull: '拉',
  pan: '摇',
  tilt: '移',
  orbit: '环绕',
  shake: '手持',
}

export const easingLabel: Record<Easing, string> = {
  linear: '匀速',
  in: '渐入',
  out: '渐出',
  inout: '缓入缓出',
}

export const planeLabel: Record<Plane, string> = {
  back: '背景',
  mid: '中景',
  fore: '前景',
}

export const transitionLabel: Record<Transition, string> = {
  cut: '硬切',
  fade: '淡入淡出',
  wipe: '擦除',
  flash: '闪白',
  slide: '滑移',
}

export const shotStatusLabel: Record<ShotStatus, string> = {
  draft: '待备料',
  keyframe: '待生成',
  generating: '生成中',
  review: '待审',
  composed: '已合成',
  failed: '失败',
}

export const emotionLabel: Record<Emotion, string> = {
  calm: '平静',
  happy: '愉快',
  angry: '愤怒',
  sad: '难过',
  tense: '紧张',
  whisper: '耳语',
}

export const slotLabel: Record<Slot, string> = {
  first: '首帧',
  last: '尾帧',
}
