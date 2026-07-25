import { createQuery } from '@tanstack/svelte-query';
import { queryKeys } from '@dashboard/shared';
import { fetchGames } from '$lib/api-client';

export function useGamesQuery() {
  return createQuery(() => ({
    queryKey: queryKeys.games.list(),
    queryFn: fetchGames,
    staleTime: 6 * 60 * 60 * 1000,
    refetchInterval: 12 * 60 * 60 * 1000,
  }));
}
