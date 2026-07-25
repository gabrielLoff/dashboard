import { createQuery } from '@tanstack/svelte-query';
import { queryKeys } from '@dashboard/shared';
import { fetchWeather } from '$lib/api-client';

export function useWeatherQuery(location?: string) {
  return createQuery(() => ({
    queryKey: queryKeys.weather.current(),
    queryFn: () => fetchWeather(location),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  }));
}
