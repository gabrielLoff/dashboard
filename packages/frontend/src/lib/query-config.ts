import { createQuery } from '@tanstack/svelte-query';
import { queryKeys } from '@dashboard/shared';
import {
  fetchWeather,
  fetchWeatherByCoords,
} from './api-client';
import { sourceConfigs as baseConfigs } from './widget-registry';

export type SourceName = 'weather' | 'news' | 'agenda' | 'games' | 'shows';

export interface WeatherArgs {
  lat?: number;
  lon?: number;
  location?: string;
}

const sourceConfigs: Record<string, typeof baseConfigs[string]> = {
  ...baseConfigs,
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
