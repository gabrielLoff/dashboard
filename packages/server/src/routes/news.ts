import { createCachedRoute } from './cached-route.ts';
import { VALID_COUNTRIES, VALID_CATEGORIES } from '../connectors/news.ts';
import type { ApiResult, NewsData, NewsFilters } from '@dashboard/shared';

const TTL = Number(process.env.CACHE_TTL_NEWS) * 1000 || 900_000;

function cacheKey(
  ctx: { req: { query: (key: string) => string | undefined } },
): string {
  const country = ctx.req.query('country') ?? 'all';
  const category = ctx.req.query('category') ?? 'general';
  return `news:${country}:${category}`;
}

function fetchFn(
  ctx: { req: { query: (key: string) => string | undefined } },
  fetchNews_: (filters: NewsFilters) => Promise<ApiResult<NewsData>>,
): Promise<ApiResult<NewsData>> {
  const country = ctx.req.query('country');
  const category = ctx.req.query('category');
  const filters: NewsFilters = {};

  if (country && VALID_COUNTRIES.includes(country as typeof VALID_COUNTRIES[number])) {
    filters.country = country;
  }
  if (category && VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    filters.category = category;
  }

  return fetchNews_(filters);
}

export function createNewsRoute(
  fetchNews_: (filters: NewsFilters) => Promise<ApiResult<NewsData>>,
) {
  return createCachedRoute(
    (ctx) => fetchFn(ctx, fetchNews_),
    TTL,
    cacheKey,
  );
}
