import type { ProviderKind } from './schema'

export const providerKindLabel: Record<ProviderKind, string> = {
  text: '文本',
  image: '图像',
  video: '视频',
  voice: '语音',
}

export const providerLabel: Record<ProviderKind, string> = {
  text: '剧本与拆解',
  image: '参考图与关键帧',
  video: '视频生成',
  voice: '配音',
}
