import type { WidgetManifest } from '@dashboard/shared';
import { queryKeys } from '@dashboard/shared';
import { fetchAgenda, refreshAgenda } from '$lib/api-client';
import AgendaWidget from './AgendaWidget.svelte';

export const manifest: WidgetManifest = {
  id: 'agenda',
  component: AgendaWidget,
  queryKey: () => queryKeys.agenda.list(),
  queryFn: () => fetchAgenda(),
  refreshFn: () => refreshAgenda(),
  staleTime: 5 * 60 * 1000,
  refetchInterval: 10 * 60 * 1000,
  defaultLayout: { col: 5, row: 2, colSpan: 1, rowSpan: 5 },
};
