import type { WidgetManifest } from '@dashboard/shared';
import { queryKeys } from '@dashboard/shared';
import { fetchUpcoming, refreshUpcoming } from '$lib/api-client';
import ShowsWidget from './ShowsWidget.svelte';

export const manifest: WidgetManifest = {
  id: 'shows',
  component: ShowsWidget,
  queryKey: (ids?: number[]) => queryKeys.shows.upcoming(ids ?? []),
  queryFn: (ids?: number[]) => fetchUpcoming(ids ?? []),
  refreshFn: (ids?: number[]) => refreshUpcoming(ids ?? []),
  staleTime: 5 * 60 * 1000,
  refetchInterval: 10 * 60 * 1000,
  defaultLayout: { col: 3, row: 5, colSpan: 3, rowSpan: 3 },
};
