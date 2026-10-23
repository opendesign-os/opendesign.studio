export const keys = {
  overview: ['overview'] as const,
  series: ['series'] as const,
  seriesDetail: (id: string) => ['series', id] as const,
  allEpisodes: ['episodes'] as const,
  episodes: (seriesId: string) => ['episodes', seriesId] as const,
  episode: (id: string) => ['episode', id] as const,
  assets: (seriesId: string) => ['assets', seriesId] as const,
  candidates: (episodeId: string) => ['candidates', episodeId] as const,
  shots: (episodeId: string) => ['shots', episodeId] as const,
  tasks: ['tasks'] as const,
  providers: ['providers'] as const,
  relations: (seriesId: string) => ['relations', seriesId] as const,
}
