import { createQuery } from '@tanstack/svelte-query';
import { queryKeys } from '@dashboard/shared';
import { fetchAgenda } from '$lib/api-client';

export function useAgendaQuery() {
  return createQuery({
    queryKey: queryKeys.agenda.list(),
    queryFn: fetchAgenda,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}
