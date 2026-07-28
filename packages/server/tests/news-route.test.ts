import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createNewsRoute } from '../src/routes/news.ts';
import { ok, type ApiResult } from '@dashboard/shared';
import type { NewsData, NewsFilters } from '@dashboard/shared';

function createApp(route: ReturnType<typeof createNewsRoute>): Hono {
  return new Hono().route('/api/news', route);
}

const mockData: NewsData = {
  items: [
    {
      id: '1',
      title: 'Test Article',
      source: 'Test Source',
      url: 'https://example.com/test',
      publishedAt: '2025-01-01T00:00:00.000Z',
      summary: 'A test summary.',
    },
  ],
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('createNewsRoute', () => {
  let fetchNews: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchNews = vi.fn().mockResolvedValue(ok(mockData));
  });

  it('calls fetchNews with empty filters when no query params', async () => {
    const route = createNewsRoute(fetchNews);
    const app = createApp(route);

    await app.request('/api/news');

    expect(fetchNews).toHaveBeenCalledWith({});
  });

  it('passes valid country filter to fetchNews', async () => {
    const route = createNewsRoute(fetchNews);
    const app = createApp(route);

    await app.request('/api/news?country=us');

    expect(fetchNews).toHaveBeenCalledWith({ country: 'us' });
  });

  it('passes valid category filter to fetchNews', async () => {
    const route = createNewsRoute(fetchNews);
    const app = createApp(route);

    await app.request('/api/news?category=technology');

    expect(fetchNews).toHaveBeenCalledWith({ category: 'technology' });
  });

  it('passes both filters to fetchNews', async () => {
    const route = createNewsRoute(fetchNews);
    const app = createApp(route);

    await app.request('/api/news?country=br&category=sports');

    expect(fetchNews).toHaveBeenCalledWith({ country: 'br', category: 'sports' });
  });

  it('ignores invalid country values', async () => {
    const route = createNewsRoute(fetchNews);
    const app = createApp(route);

    await app.request('/api/news?country=zz');

    expect(fetchNews).toHaveBeenCalledWith({});
  });

  it('ignores invalid category values', async () => {
    const route = createNewsRoute(fetchNews);
    const app = createApp(route);

    await app.request('/api/news?category=invalid');

    expect(fetchNews).toHaveBeenCalledWith({});
  });

  it('returns data from fetchNews', async () => {
    const route = createNewsRoute(fetchNews);
    const app = createApp(route);

    const res = await app.request('/api/news');
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.data).toEqual(mockData);
  });

  it('uses news:all:general as default cache key', async () => {
    const route = createNewsRoute(fetchNews);
    const app = createApp(route);

    await app.request('/api/news');
    await app.request('/api/news');

    expect(fetchNews).toHaveBeenCalledTimes(1);
  });

  it('uses distinct cache keys for different country values', async () => {
    const route = createNewsRoute(fetchNews);
    const app = createApp(route);

    await app.request('/api/news?country=us');
    await app.request('/api/news?country=br');

    expect(fetchNews).toHaveBeenCalledTimes(2);
  });

  it('uses distinct cache keys for different category values', async () => {
    const route = createNewsRoute(fetchNews);
    const app = createApp(route);

    await app.request('/api/news?category=technology');
    await app.request('/api/news?category=sports');

    expect(fetchNews).toHaveBeenCalledTimes(2);
  });

  it('uses distinct cache keys for different filter combos', async () => {
    const route = createNewsRoute(fetchNews);
    const app = createApp(route);

    await app.request('/api/news?country=us&category=technology');
    await app.request('/api/news?country=us&category=sports');
    await app.request('/api/news?country=gb&category=technology');

    expect(fetchNews).toHaveBeenCalledTimes(3);
  });

  it('reuses cache for identical filter combos', async () => {
    const route = createNewsRoute(fetchNews);
    const app = createApp(route);

    await app.request('/api/news?country=us&category=technology');
    await app.request('/api/news?country=us&category=technology');

    expect(fetchNews).toHaveBeenCalledTimes(1);
  });

  it('POST /refresh busts cache and re-fetches', async () => {
    const freshData: NewsData = {
      ...mockData,
      items: [{ ...mockData.items[0], title: 'Fresh Article' }],
    };
    fetchNews
      .mockResolvedValueOnce(ok(mockData))
      .mockResolvedValueOnce(ok(freshData));

    const route = createNewsRoute(fetchNews);
    const app = createApp(route);

    await app.request('/api/news?country=us');
    const postRes = await app.request('/api/news/refresh?country=us', { method: 'POST' });
    const postJson = await postRes.json();
    expect(postJson.data.items[0].title).toBe('Fresh Article');

    const getRes = await app.request('/api/news?country=us');
    const getJson = await getRes.json();
    expect(getJson.data.items[0].title).toBe('Fresh Article');
    expect(fetchNews).toHaveBeenCalledTimes(2);
  });

  it('validates all allowed country values', async () => {
    const validCountries = ['ar', 'au', 'br', 'ca', 'cn', 'de', 'es', 'fr', 'gb', 'in', 'it', 'mx', 'nl', 'nz', 'pt', 'ru', 'sa', 'us'];
    const route = createNewsRoute(fetchNews);
    const app = createApp(route);

    for (const country of validCountries) {
      fetchNews.mockClear();
      await app.request(`/api/news?country=${country}`);
      expect(fetchNews).toHaveBeenCalledWith({ country });
    }
  });

  it('validates all allowed category values', async () => {
    const validCategories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];
    const route = createNewsRoute(fetchNews);
    const app = createApp(route);

    for (const category of validCategories) {
      fetchNews.mockClear();
      await app.request(`/api/news?category=${category}`);
      expect(fetchNews).toHaveBeenCalledWith({ category });
    }
  });
});
