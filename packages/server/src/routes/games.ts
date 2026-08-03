import { createCachedRoute } from './cached-route.ts';
import { VALID_TYPES, VALID_PLATFORMS } from '../connectors/games.ts';
import type { ApiResult, FreeGamesData, GamesFilters } from '@dashboard/shared';

const TTL = Number(process.env.CACHE_TTL_GAMES) * 1000 || 7_200_000;

function cacheKey(
  ctx: { req: { query: (key: string) => string | undefined } },
): string {
  const platform = ctx.req.query('platform') ?? 'all';
  const type = ctx.req.query('type') ?? 'all';
  const page = ctx.req.query('page') ?? '1';
  return `games:${platform}:${type}:${page}`;
}

async function fetchFn(
  ctx: { req: { query: (key: string) => string | undefined } },
  fetchGames_: (filters: GamesFilters) => Promise<ApiResult<FreeGamesData>>,
): Promise<ApiResult<FreeGamesData>> {
  const type = ctx.req.query('type');
  const platform = ctx.req.query('platform');
  const page = ctx.req.query('page');
  const filters: GamesFilters = {};

  if (type && VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
    filters.type = type as GamesFilters['type'];
  }
  if (platform && VALID_PLATFORMS.includes(platform as typeof VALID_PLATFORMS[number])) {
    filters.platform = platform as GamesFilters['platform'];
  }
  if (page) {
    const pageNum = parseInt(page, 10);
    if (!isNaN(pageNum) && pageNum > 0) filters.page = pageNum;
  }

  return fetchGames_(filters);
}

export function createGamesRoute(
  fetchGames_: (filters: GamesFilters) => Promise<ApiResult<FreeGamesData>>,
) {
  return createCachedRoute(
    (ctx) => fetchFn(ctx, fetchGames_),
    TTL,
    cacheKey,
  );
}