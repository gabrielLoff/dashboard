import type { QueryWidget } from '@dashboard/shared';
import GamesWidget from './GamesWidget.svelte';

export const manifest = {
  id: 'games',
  component: GamesWidget,
  zone: 'carousel',
  endpoint: 'GET /api/games',
  staleTime: 6 * 60 * 60 * 1000,
  refetchInterval: 12 * 60 * 60 * 1000,
} satisfies QueryWidget;
