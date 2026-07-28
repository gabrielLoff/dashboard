import type { ApiResult, NewsData, NewsFilters } from '@dashboard/shared';
import { err } from '@dashboard/shared';

export type { NewsFilters };

const API_KEY = process.env.CURRENTS_API_KEY;
const BASE_URL = process.env.CURRENTS_API_URL ?? 'https://api.currentsapi.services/v1';

export const VALID_COUNTRIES = ['us', 'br'] as const;

export const VALID_CATEGORIES = [
  'business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology',
] as const;

export type NewsCountry = (typeof VALID_COUNTRIES)[number];
export type NewsCategory = (typeof VALID_CATEGORIES)[number];

interface CurrentsNewsItem {
  title: string;
  source: string;
  url: string;
  published: string;
  description: string;
  image: string | null;
}

interface CurrentsResponse {
  news: CurrentsNewsItem[];
}

export function buildQueryParams(filters: NewsFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.country) params.set('country', filters.country);
  if (filters.category) params.set('category', filters.category);
  return params;
}

export async function fetchNews(filters: NewsFilters = {}): Promise<ApiResult<NewsData>> {
  try {
    const params = buildQueryParams(filters);
    const query = params.toString();
    const url = `${BASE_URL}/latest-news${query ? `?${query}` : ''}`;

    const res = await fetch(url, {
      headers: { Authorization: API_KEY ?? '' },
    });

    if (!res.ok) {
      return err(`Currents API returned ${res.status}: ${res.statusText}`);
    }

    const json = (await res.json()) as CurrentsResponse;

    return {
      ok: true,
      data: {
        items: json.news.map((a, i) => ({
          id: String(i),
          title: a.title,
          source: a.source,
          url: a.url,
          publishedAt: a.published,
          summary: a.description,
          ...(a.image ? { imageUrl: a.image } : {}),
        })),
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to fetch news');
  }
}
