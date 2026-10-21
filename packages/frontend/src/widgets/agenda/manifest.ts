import type { QueryWidget } from '@dashboard/shared';
import AgendaWidget from './AgendaWidget.svelte';

export const manifest = {
  id: 'agenda',
  component: AgendaWidget,
  zone: 'left',
  endpoint: 'GET /api/agenda',
  staleTime: 5 * 60 * 1000,
  refetchInterval: 10 * 60 * 1000,
} satisfies QueryWidget;
