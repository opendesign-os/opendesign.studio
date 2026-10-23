import type { Aspect } from './schema'

export const formats: Record<
  Aspect,
  { label: string; hint: string; width: number; height: number }
> = {
  '9:16': { label: '竖屏', hint: '手机全屏 · 抖音、快手、视频号', width: 1080, height: 1920 },
  '16:9': { label: '横屏', hint: '电脑、电视 · B 站、西瓜、YouTube', width: 1920, height: 1080 },
  '3:4': { label: '竖版', hint: '小红书、平板竖放', width: 1080, height: 1440 },
  '4:3': { label: '横版', hint: '平板横放、经典电视', width: 1440, height: 1080 },
  '1:1': { label: '方形', hint: '信息流、封面', width: 1080, height: 1080 },
  '21:9': { label: '宽银幕', hint: '电影感，上下留黑边播放', width: 2560, height: 1080 },
}
