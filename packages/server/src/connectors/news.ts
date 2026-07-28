import type { ApiResult, NewsData, NewsFilters } from '@dashboard/shared';
import { err } from '@dashboard/shared';

export type { NewsFilters };

const API_KEY = process.env.NEWSLETTER_API_KEY;
const BASE_URL = process.env.NEWSLETTER_API_URL ?? 'https://newsapi.org/v2';

export const VALID_COUNTRIES = [
  'ar', 'au', 'br', 'ca', 'cn', 'de', 'es', 'fr', 'gb', 'in', 'it', 'mx', 'nl', 'nz', 'pt', 'ru', 'sa', 'us',
] as const;

export const VALID_CATEGORIES = [
  'business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology',
] as const;

export type NewsCountry = (typeof VALID_COUNTRIES)[number];
export type NewsCategory = (typeof VALID_CATEGORIES)[number];

function buildQueryParams(filters: NewsFilters): string {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.country) params.set('country', filters.country);
  if (!filters.category && !filters.country) params.set('category', 'general');
  params.set('apiKey', API_KEY ?? '');
  params.set('pageSize', '5');
  return params.toString();
}

export async function fetchNews(filters: NewsFilters = {}): Promise<ApiResult<NewsData>> {
  try {
    const query = buildQueryParams(filters);
    const res = await fetch(`${BASE_URL}/top-headlines?${query}`);

    if (!res.ok) {
      return err(`News API returned ${res.status}: ${res.statusText}`);
    }

    const json = (await res.json()) as {
      articles: { title: string; source: { name: string }; url: string; publishedAt: string; description: string }[];
    };

    return {
      ok: true,
      data: {
        items: json.articles.map((a, i) => ({
          id: String(i),
          title: a.title,
          source: a.source.name,
          url: a.url,
          publishedAt: a.publishedAt,
          summary: a.description || '',
        })),
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to fetch news');
  }
}
