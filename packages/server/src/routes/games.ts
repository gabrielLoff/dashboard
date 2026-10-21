import { createCachedRoute, type Params } from './cached-route.ts';
import { VALID_TYPES, VALID_PLATFORMS } from '../connectors/games.ts';
import type { ApiResult, FreeGamesData, GamesFilters } from '@dashboard/shared';

const TTL = Number(process.env.CACHE_TTL_GAMES) * 1000 || 7_200_000;

function cacheKey(params: Params): string {
  const platform = params.platform ?? 'all';
  const type = params.type ?? 'all';
  const page = params.page ?? '1';
  return `games:${platform}:${type}:${page}`;
}

async function fetchFn(
  params: Params,
  fetchGames_: (filters: GamesFilters) => Promise<ApiResult<FreeGamesData>>,
): Promise<ApiResult<FreeGamesData>> {
  const filters: GamesFilters = {};

  if (params.type && VALID_TYPES.includes(params.type as typeof VALID_TYPES[number])) {
    filters.type = params.type as GamesFilters['type'];
  }
  if (params.platform && VALID_PLATFORMS.includes(params.platform as typeof VALID_PLATFORMS[number])) {
    filters.platform = params.platform as GamesFilters['platform'];
  }
  if (params.page) {
    const pageNum = parseInt(params.page, 10);
    if (!isNaN(pageNum) && pageNum > 0) filters.page = pageNum;
  }

  return fetchGames_(filters);
}

export function createGamesRoute(
  fetchGames_: (filters: GamesFilters) => Promise<ApiResult<FreeGamesData>>,
) {
  return createCachedRoute(
    (params) => fetchFn(params, fetchGames_),
    TTL,
    cacheKey,
  );
}
