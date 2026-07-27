import { createCachedRoute } from './cached-route.ts';
import { fetchAgenda } from '../connectors/agenda.ts';
import { resetTokenCache } from '../lib/google-auth.ts';

const TTL = Number(process.env.CACHE_TTL_AGENDA) * 1000 || 600_000;

export const agendaRoute = createCachedRoute(
  (_ctx) => fetchAgenda(),
  TTL,
  () => 'agenda',
  resetTokenCache,
);
