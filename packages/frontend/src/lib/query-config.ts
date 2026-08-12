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

function getWeatherConfig() {
  return {
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
  };
}

function getSourceConfig(name: SourceName) {
  if (name === 'weather') {
    return getWeatherConfig();
  }
  return baseConfigs[name];
}

export function useSourceQuery(name: SourceName, ...args: unknown[]) {
  const config = getSourceConfig(name);
  if (!config) {
    throw new Error(`Unknown source: ${name}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedArgs = args as any[];
  return createQuery({
    queryKey: config.key(...typedArgs),
    queryFn: (): Promise<any> => config.fn(...typedArgs),
    staleTime: config.staleTime,
    refetchInterval: config.refetchInterval,
  });
}
