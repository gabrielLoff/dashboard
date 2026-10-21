import { createCachedRoute, type Params } from './cached-route.ts';
import { VALID_COUNTRIES, VALID_CATEGORIES } from '../connectors/news.ts';
import type { ApiResult, NewsData, NewsFilters } from '@dashboard/shared';

const TTL = Number(process.env.CACHE_TTL_NEWS) * 1000 || 900_000;

function cacheKey(params: Params): string {
  const country = params.country ?? 'all';
  const category = params.category ?? 'general';
  return `news:${country}:${category}`;
}

function fetchFn(
  params: Params,
  fetchNews_: (filters: NewsFilters) => Promise<ApiResult<NewsData>>,
): Promise<ApiResult<NewsData>> {
  const filters: NewsFilters = {};

  if (params.country && VALID_COUNTRIES.includes(params.country as typeof VALID_COUNTRIES[number])) {
    filters.country = params.country;
  }
  if (params.category && VALID_CATEGORIES.includes(params.category as typeof VALID_CATEGORIES[number])) {
    filters.category = params.category;
  }

  return fetchNews_(filters);
}

export function createNewsRoute(
  fetchNews_: (filters: NewsFilters) => Promise<ApiResult<NewsData>>,
) {
  return createCachedRoute(
    (params) => fetchFn(params, fetchNews_),
    TTL,
    cacheKey,
  );
}
