import { createQuery } from '@tanstack/svelte-query';
import { queryKeys } from '@dashboard/shared';
import { fetchGames, type GamesFilters } from '$lib/api-client';

export function useGamesQuery(filters?: GamesFilters) {
  return createQuery({
    queryKey: queryKeys.games.list(filters),
    queryFn: () => fetchGames(filters),
    staleTime: 6 * 60 * 60 * 1000,
    refetchInterval: 12 * 60 * 60 * 1000,
  });
}
