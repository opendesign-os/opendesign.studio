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
  output: z.string().optional(),
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
  updatedAt: z.iso.datetime(),
})

export const seriesDraft = series.pick({ title: true, aspect: true, synopsis: true })

export const seriesPatch = series.omit({ id: true, updatedAt: true }).partial()

export const episodeDraft = episode.pick({ title: true, hook: true })

export const episodePatch = episode.pick({ title: true, hook: true, script: true }).partial()

export type Aspect = z.infer<typeof aspect>
export type SeriesStatus = z.infer<typeof seriesStatus>
export type EpisodeStatus = z.infer<typeof episodeStatus>
export type Episode = z.infer<typeof episode>
export type Series = z.infer<typeof series>
export type SeriesDraft = z.infer<typeof seriesDraft>
export type SeriesPatch = z.infer<typeof seriesPatch>
export type EpisodeDraft = z.infer<typeof episodeDraft>
export type EpisodePatch = z.infer<typeof episodePatch>

export function resume(episodes: Episode[]) {
  const ordered = [...episodes].sort((a, b) => a.index - b.index)
  return ordered.find((item) => item.status !== 'done') ?? ordered.at(-1)
}
