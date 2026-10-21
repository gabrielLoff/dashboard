import type { QueryWidget } from '@dashboard/shared';
import ShowsWidget from './ShowsWidget.svelte';

export const manifest = {
  id: 'shows',
  component: ShowsWidget,
  zone: 'carousel',
  endpoint: 'GET /api/shows/upcoming',
  staleTime: 5 * 60 * 1000,
  refetchInterval: 10 * 60 * 1000,
} satisfies QueryWidget;
