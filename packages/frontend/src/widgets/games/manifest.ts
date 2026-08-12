import type { WidgetManifest, GamesFilters } from '@dashboard/shared';
import { queryKeys } from '@dashboard/shared';
import { fetchGames, refreshGames } from '$lib/api-client';
import GamesWidget from './GamesWidget.svelte';

export const manifest: WidgetManifest = {
  id: 'games',
  component: GamesWidget,
  zone: 'carousel',
  queryKey: (filters?: GamesFilters) => queryKeys.games.list(filters),
  queryFn: (filters?: GamesFilters) => fetchGames(filters),
  refreshFn: (filters?: GamesFilters) => refreshGames(filters),
  staleTime: 6 * 60 * 60 * 1000,
  refetchInterval: 12 * 60 * 60 * 1000,
  defaultLayout: { col: 2, row: 3, colSpan: 3, rowSpan: 4 },
};
