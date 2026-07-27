import { createCachedRoute } from './cached-route.ts';
import { fetchGames, type GamesFilters, VALID_TYPES, VALID_PLATFORMS } from '../connectors/games.ts';
import type { ApiResult, FreeGamesData } from '@dashboard/shared';

const TTL = Number(process.env.CACHE_TTL_GAMES) * 1000 || 7_200_000;

function cacheKey(
  ctx: { req: { query: (key: string) => string | undefined } },
): string {
  const q = ctx.req.query();
  return `games:${q.platform ?? 'all'}:${q.type ?? 'all'}:${q.page ?? '1'}`;
}

async function fetchFn(
  ctx: { req: { query: (key: string) => string | undefined } },
): Promise<ApiResult<FreeGamesData>> {
  const q = ctx.req.query();
  const filters: GamesFilters = {};

  if (q.type && VALID_TYPES.includes(q.type as typeof VALID_TYPES[number])) {
    filters.type = q.type as GamesFilters['type'];
  }
  if (q.platform && VALID_PLATFORMS.includes(q.platform as typeof VALID_PLATFORMS[number])) {
    filters.platform = q.platform as GamesFilters['platform'];
  }
  if (q.page) {
    const page = parseInt(q.page as string, 10);
    if (!isNaN(page) && page > 0) filters.page = page;
  }

  return fetchGames(filters);
}

export const gamesRoute = createCachedRoute(fetchFn, TTL, cacheKey);