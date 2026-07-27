import { Hono } from 'hono';
import { fetchNews } from '../connectors/news.ts';
import { TTLCache } from '../cache.ts';
import type { NewsData } from '@dashboard/shared';

const TTL = Number(process.env.CACHE_TTL_NEWS) * 1000 || 900_000;
const cache = new TTLCache<NewsData>(TTL);

export const newsRoute = new Hono()
  .get('/', async (c) => {
    const cached = cache.get('news');
    if (cached) return c.json({ ok: true, data: cached });

    const result = await fetchNews();
    if (result.ok) {
      cache.set('news', result.data);
    }
    return c.json(result);
  })
  .post('/refresh', async (c) => {
    cache.delete('news');
    const result = await fetchNews();
    if (result.ok) {
      cache.set('news', result.data);
    }
    return c.json(result);
  });
