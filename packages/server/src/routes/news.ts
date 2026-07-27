import { createCachedRoute } from './cached-route.ts';
import type { ApiResult, NewsData } from '@dashboard/shared';

const TTL = Number(process.env.CACHE_TTL_NEWS) * 1000 || 900_000;

export function createNewsRoute(
  fetchNews_: () => Promise<ApiResult<NewsData>>,
) {
  return createCachedRoute(
    (_ctx) => fetchNews_(),
    TTL,
    () => 'news',
  );
}