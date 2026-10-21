import type { QueryWidget } from '@dashboard/shared';
import WeatherWidget from './WeatherWidget.svelte';

export type { WeatherArgs } from '@dashboard/shared';

export const manifest = {
  id: 'weather',
  component: WeatherWidget,
  zone: 'left',
  endpoint: 'GET /api/weather',
  staleTime: 5 * 60 * 1000,
  refetchInterval: 10 * 60 * 1000,
} satisfies QueryWidget;
