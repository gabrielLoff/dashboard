import type { WidgetManifest, NewsFilters } from '@dashboard/shared';
import { queryKeys } from '@dashboard/shared';
import { fetchNews, refreshNews } from '$lib/api-client';
import NewsWidget from './NewsWidget.svelte';

export const manifest: WidgetManifest = {
  id: 'news',
  component: NewsWidget,
  zone: 'carousel',
  queryKey: (filters?: NewsFilters) => queryKeys.news.list(filters),
  queryFn: (filters?: NewsFilters) => fetchNews(filters),
  refreshFn: (filters?: NewsFilters) => refreshNews(filters),
  staleTime: 15 * 60 * 1000,
  refetchInterval: 30 * 60 * 1000,
  defaultLayout: { col: 0, row: 3, colSpan: 2, rowSpan: 4 },
};
