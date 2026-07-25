import { createQuery } from '@tanstack/svelte-query';
import { queryKeys } from '@dashboard/shared';
import { fetchNews } from '$lib/api-client';

export function useNewsQuery() {
  return createQuery(() => ({
    queryKey: queryKeys.news.list(),
    queryFn: fetchNews,
    staleTime: 15 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
  }));
}
