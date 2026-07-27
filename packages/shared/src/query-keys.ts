export const queryKeys = {
  all: ['dashboard'] as const,

  weather: {
    all: ['dashboard', 'weather'] as const,
    current: () => [...queryKeys.weather.all] as const,
    byCoords: (lat: number, lon: number) => [...queryKeys.weather.all, lat.toFixed(2), lon.toFixed(2)] as const,
  },

  news: {
    all: ['dashboard', 'news'] as const,
    list: () => [...queryKeys.news.all] as const,
  },

  agenda: {
    all: ['dashboard', 'agenda'] as const,
    list: () => [...queryKeys.agenda.all] as const,
  },

  games: {
    all: ['dashboard', 'games'] as const,
    list: (filters?: { type?: string; platform?: string; page?: number }) =>
      [...queryKeys.games.all, filters?.type ?? 'all', filters?.platform ?? 'pc', filters?.page ?? 1] as const,
  },
} as const;
