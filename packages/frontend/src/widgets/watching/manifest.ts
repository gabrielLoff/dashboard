import type { QueryWidget } from '@dashboard/shared';
import WatchingWidget from './WatchingWidget.svelte';

export const manifest = {
  id: 'watching',
  component: WatchingWidget,
  zone: 'carousel',
  endpoint: 'GET /api/sync',
  staleTime: 60_000,
  refetchInterval: 120_000,
} satisfies QueryWidget;
