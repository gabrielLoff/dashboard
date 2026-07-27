import type { ApiResult, NewsData } from '@dashboard/shared';
import { err } from '@dashboard/shared';

const API_KEY = process.env.NEWSLETTER_API_KEY;
const BASE_URL = process.env.NEWSLETTER_API_URL ?? 'https://newsapi.org/v2';

export async function fetchNews(): Promise<ApiResult<NewsData>> {
  try {
    const res = await fetch(
      `${BASE_URL}/top-headlines?category=general&apiKey=${API_KEY}&pageSize=5`,
    );

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