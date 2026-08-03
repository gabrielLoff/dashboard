import { createQuery } from '@tanstack/svelte-query';
import { queryKeys } from '@dashboard/shared';
import {
  fetchWeather,
  fetchWeatherByCoords,
  fetchNews,
  fetchAgenda,
  fetchGames,
  fetchUpcoming,
} from './api-client';
import type { GamesFilters, NewsFilters } from '@dashboard/shared';

export type SourceName = 'weather' | 'news' | 'agenda' | 'games' | 'shows';

export interface WeatherArgs {
  lat?: number;
  lon?: number;
  location?: string;
}

interface SourceConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  key: (...args: any[]) => readonly unknown[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (...args: any[]) => Promise<any>;
  staleTime: number;
  refetchInterval: number;
}

const sourceConfigs: Record<SourceName, SourceConfig> = {
  weather: {
    key: (args?: WeatherArgs) =>
      args?.lat != null && args?.lon != null
        ? queryKeys.weather.byCoords(args.lat, args.lon)
        : queryKeys.weather.current(),
    fn: (args?: WeatherArgs) =>
      args?.lat != null && args?.lon != null
        ? fetchWeatherByCoords(args.lat, args.lon)
        : fetchWeather(args?.location),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  },
  news: {
    key: (filters?: NewsFilters) => queryKeys.news.list(filters),
    fn: (filters?: NewsFilters) => fetchNews(filters),
    staleTime: 15 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
  },
  agenda: {
    key: () => queryKeys.agenda.list(),
    fn: fetchAgenda,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  },
  games: {
    key: (filters?: GamesFilters) => queryKeys.games.list(filters),
    fn: (filters?: GamesFilters) => fetchGames(filters),
    staleTime: 6 * 60 * 60 * 1000,
    refetchInterval: 12 * 60 * 60 * 1000,
  },
  shows: {
    key: (ids?: number[]) => queryKeys.shows.upcoming(ids ?? []),
    fn: (ids?: number[]) => fetchUpcoming(ids ?? []),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  },
};

export function useSourceQuery(name: SourceName, ...args: unknown[]) {
  const config = sourceConfigs[name];
  if (!config) {
    throw new Error(`Unknown source: ${name}`);
  }
  return createQuery({
    queryKey: config.key(...args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryFn: (): Promise<any> => config.fn(...args),
    staleTime: config.staleTime,
    refetchInterval: config.refetchInterval,
  });
}
