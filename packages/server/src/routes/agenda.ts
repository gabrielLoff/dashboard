import { createCachedRoute } from './cached-route.ts';
import { resetTokenCache } from '../lib/google-auth.ts';
import type { ApiResult, AgendaData } from '@dashboard/shared';

const TTL = Number(process.env.CACHE_TTL_AGENDA) * 1000 || 600_000;

export function createAgendaRoute(
  fetchAgenda_: () => Promise<ApiResult<AgendaData>>,
) {
  return createCachedRoute(
    (_ctx) => fetchAgenda_(),
    TTL,
    () => 'agenda',
    resetTokenCache,
  );
}