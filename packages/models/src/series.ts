import { z } from 'zod'

export const aspect = z.enum(['9:16', '16:9', '3:4', '4:3', '1:1', '21:9'])

export const seriesStatus = z.enum(['writing', 'producing', 'review', 'published'])

export const episodeStatus = z.enum(['draft', 'parsing', 'producing', 'review', 'done'])

export const episode = z.object({
  id: z.string(),
  seriesId: z.string(),
  index: z.number().int().positive(),
  title: z.string().min(1).max(40),
  hook: z.string().max(60),
  script: z.string(),
  duration: z.number().nonnegative(),
  shots: z.number().int().nonnegative(),
  done: z.number().int().nonnegative(),
  status: episodeStatus,
})

export const series = z.object({
  id: z.string(),
  title: z.string().min(1, '剧名不能为空').max(30, '剧名最多 30 个字'),
  aspect,
  synopsis: z.string().max(200, '梗概最多 200 个字'),
  outline: z.string(),
  tags: z.array(z.string()),
  status: seriesStatus,
  color: z.string(),
  updated: z.string(),
})

export type Aspect = z.infer<typeof aspect>
export type SeriesStatus = z.infer<typeof seriesStatus>
export type EpisodeStatus = z.infer<typeof episodeStatus>
export type Episode = z.infer<typeof episode>
export type Series = z.infer<typeof series>
export type EpisodePatch = Partial<Pick<Episode, 'title' | 'hook' | 'script'>>
export type SeriesPatch = Partial<Omit<Series, 'id' | 'updated'>>

export function resume(episodes: Episode[]) {
  const ordered = [...episodes].sort((a, b) => a.index - b.index)
  return ordered.find((item) => item.status !== 'done') ?? ordered.at(-1)
}

export const seriesStatusLabel: Record<SeriesStatus, string> = {
  writing: '剧本中',
  producing: '制作中',
  review: '待审',
  published: '已发布',
}

export const episodeStatusLabel: Record<EpisodeStatus, string> = {
  draft: '待拆解',
  parsing: '拆解中',
  producing: '制作中',
  review: '待审',
  done: '已完成',
}

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
