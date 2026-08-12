import type { WidgetManifest } from '@dashboard/shared';
import { queryKeys } from '@dashboard/shared';
import { fetchWeather, fetchWeatherByCoords, refreshWeather, refreshWeatherByCoords } from '$lib/api-client';
import WeatherWidget from './WeatherWidget.svelte';

export interface WeatherArgs {
  lat?: number;
  lon?: number;
  location?: string;
}

export const manifest: WidgetManifest = {
  id: 'weather',
  component: WeatherWidget,
  zone: 'left',
  queryKey: (args?: WeatherArgs) =>
    args?.lat != null && args?.lon != null
      ? queryKeys.weather.byCoords(args.lat, args.lon)
      : queryKeys.weather.current(),
  queryFn: (args?: WeatherArgs) =>
    args?.lat != null && args?.lon != null
      ? fetchWeatherByCoords(args.lat, args.lon)
      : fetchWeather(args?.location),
  refreshFn: (args?: WeatherArgs) =>
    args?.lat != null && args?.lon != null
      ? refreshWeatherByCoords(args.lat, args.lon)
      : refreshWeather(args?.location),
  staleTime: 5 * 60 * 1000,
  refetchInterval: 10 * 60 * 1000,
  defaultLayout: { col: 0, row: 0, colSpan: 3, rowSpan: 3 },
};
