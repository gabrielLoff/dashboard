import { createQuery } from '@tanstack/svelte-query';
import { queryKeys } from '@dashboard/shared';
import {
  fetchWeather,
  fetchWeatherByCoords,
  fetchNews,
  fetchAgenda,
  fetchGames,
} from './api-client';
import type { GamesFilters, NewsFilters } from './api-client';

export type SourceName = 'weather' | 'news' | 'agenda' | 'games';

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
    key: () => queryKeys.weather.current(),
    fn: () => fetchWeather(),
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

const WEATHER_TIMING = {
  staleTime: 5 * 60 * 1000,
  refetchInterval: 10 * 60 * 1000,
} as const;

interface WeatherCoordsArgs {
  lat: number;
  lon: number;
}

interface WeatherLocationArgs {
  location?: string;
}

export function buildWeatherQueryOptions(
  args: WeatherCoordsArgs | WeatherLocationArgs = {},
) {
  if ('lat' in args && 'lon' in args) {
    return {
      queryKey: queryKeys.weather.byCoords(args.lat, args.lon) as unknown as string[],
      queryFn: () => fetchWeatherByCoords(args.lat, args.lon),
      ...WEATHER_TIMING,
    };
  }
  const location = 'location' in args ? args.location : undefined;
  return {
    queryKey: queryKeys.weather.current() as unknown as string[],
    queryFn: () => fetchWeather(location),
    ...WEATHER_TIMING,
  };
}

export function useWeatherQuery(args?: WeatherLocationArgs) {
  return createQuery(buildWeatherQueryOptions(args));
}
