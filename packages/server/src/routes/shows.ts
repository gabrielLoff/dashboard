import { Hono } from 'hono';
import { createCachedRoute } from './cached-route.ts';
import type { ApiResult, ShowSearchResult, ShowsData } from '@dashboard/shared';

const UPCOMING_TTL = Number(process.env.CACHE_TTL_SHOWS) * 1000 || 300_000;

function upcomingCacheKey(
  ctx: { req: { query: (key: string) => string | undefined } },
): string {
  const ids = ctx.req.query('ids') ?? '';
  const sorted = ids
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b)
    .join(',');
  return `shows:${sorted}`;
}

function upcomingFetchFn(
  ctx: { req: { query: (key: string) => string | undefined } },
  getUpcoming_: (ids: number[]) => Promise<ApiResult<ShowsData>>,
): Promise<ApiResult<ShowsData>> {
  const ids = ctx.req.query('ids') ?? '';
  const parsed = ids
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => !isNaN(n) && n > 0);

  return getUpcoming_(parsed);
}

export function createShowsRoute(
  searchShows_: (query: string) => Promise<ApiResult<ShowSearchResult[]>>,
  getUpcoming_: (ids: number[]) => Promise<ApiResult<ShowsData>>,
) {
  const upcomingRoute = createCachedRoute(
    (ctx) => upcomingFetchFn(ctx, getUpcoming_),
    UPCOMING_TTL,
    upcomingCacheKey,
  );

  return new Hono()
    .get('/search', async (c) => {
      const q = c.req.query('q') ?? '';
      const result = await searchShows_(q);
      return c.json(result);
    })
    .route('/upcoming', upcomingRoute);
}
