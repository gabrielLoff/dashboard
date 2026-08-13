import type { WidgetManifest } from '@dashboard/shared';
import { queryKeys } from '@dashboard/shared';
import { fetchProgress, refreshProgress } from '$lib/api-client';
import WatchingWidget from './WatchingWidget.svelte';

export const manifest: WidgetManifest = {
  id: 'watching',
  component: WatchingWidget,
  zone: 'carousel',
  queryKey: () => queryKeys.progress.list(),
  queryFn: () => fetchProgress(),
  refreshFn: () => refreshProgress(),
  staleTime: 60_000,
  refetchInterval: 120_000,
  defaultLayout: { col: 0, row: 0, colSpan: 3, rowSpan: 3 },
};
