import type { QueryWidget } from '@dashboard/shared';
import NewsWidget from './NewsWidget.svelte';

export const manifest = {
  id: 'news',
  component: NewsWidget,
  zone: 'carousel',
  endpoint: 'GET /api/news',
  staleTime: 15 * 60 * 1000,
  refetchInterval: 30 * 60 * 1000,
} satisfies QueryWidget;
