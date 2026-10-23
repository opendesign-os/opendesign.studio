import type { EpisodeStatus, SeriesStatus } from './schema'

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
