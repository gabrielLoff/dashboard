import { Hono } from 'hono';
import { TTLCache } from '../cache.ts';
import type { ApiResult } from '@dashboard/shared';

type FetchFn<T> = (ctx: { req: { query: (key: string) => string | undefined } }) => Promise<ApiResult<T>>;
type CacheKeyFn = (ctx: { req: { query: (key: string) => string | undefined } }) => string;

export function createCachedRoute<T>(
  fetchFn: FetchFn<T>,
  ttlMs: number,
  cacheKeyFn: CacheKeyFn,
): Hono {
  const cache = new TTLCache<T>(ttlMs);

  return new Hono()
    .get('/', async (c) => {
      const key = cacheKeyFn(c);
      const cached = cache.get(key);
      if (cached) return c.json({ ok: true, data: cached });

      const result = await fetchFn(c);
      if (result.ok) cache.set(key, result.data);
      return c.json(result);
    })
    .post('/refresh', async (c) => {
      const key = cacheKeyFn(c);
      cache.delete(key);

      const result = await fetchFn(c);
      if (result.ok) cache.set(key, result.data);
      return c.json(result);
    });
}
