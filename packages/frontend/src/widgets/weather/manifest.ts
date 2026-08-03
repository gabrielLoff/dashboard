import type { WidgetManifest } from '@dashboard/shared';
import { queryKeys } from '@dashboard/shared';
import { fetchWeather, refreshWeather } from '$lib/api-client';
import WeatherWidget from './WeatherWidget.svelte';

export const manifest: WidgetManifest = {
  id: 'weather',
  component: WeatherWidget,
  queryKey: () => queryKeys.weather.current(),
  queryFn: () => fetchWeather(),
  refreshFn: () => refreshWeather(),
  staleTime: 5 * 60 * 1000,
  refetchInterval: 10 * 60 * 1000,
  defaultLayout: { col: 0, row: 0, colSpan: 3, rowSpan: 3 },
};
