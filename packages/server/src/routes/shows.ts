import { Hono } from 'hono';
import { createCachedRoute, type Params } from './cached-route.ts';
import type { ApiResult, ShowSearchResult, ShowsData, EpisodeListEntry } from '@dashboard/shared';

const UPCOMING_TTL = Number(process.env.CACHE_TTL_SHOWS) * 1000 || 300_000;

function upcomingCacheKey(params: Params): string {
  const ids = params.ids ?? '';
  const sorted = ids
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b)
    .join(',');
  return `shows:${sorted}`;
}

function upcomingFetchFn(
  params: Params,
  getUpcoming_: (ids: number[]) => Promise<ApiResult<ShowsData>>,
): Promise<ApiResult<ShowsData>> {
  const ids = params.ids ?? '';
  const parsed = ids
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => !isNaN(n) && n > 0);

  return getUpcoming_(parsed);
}

export function createShowsRoute(
  searchShows_: (query: string) => Promise<ApiResult<ShowSearchResult[]>>,
  getUpcoming_: (ids: number[]) => Promise<ApiResult<ShowsData>>,
  fetchEpisodes_: (showId: number) => Promise<ApiResult<EpisodeListEntry[]>>,
) {
  const upcomingRoute = createCachedRoute(
    (params) => upcomingFetchFn(params, getUpcoming_),
    UPCOMING_TTL,
    upcomingCacheKey,
  );

  return new Hono()
    .get('/search', async (c) => {
      const q = c.req.query('q') ?? '';
      const result = await searchShows_(q);
      return c.json(result);
    })
    .get('/episodes', async (c) => {
      const id = c.req.query('id');
      const showId = id ? Number(id) : NaN;
      if (isNaN(showId) || showId <= 0) {
        return c.json({ ok: false, error: 'Invalid show id' }, 400);
      }
      const result = await fetchEpisodes_(showId);
      return c.json(result);
    })
    .route('/upcoming', upcomingRoute);
}
