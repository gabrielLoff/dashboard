import type { Context } from 'hono';
import { Hono } from 'hono';
import { TTLCache } from '../cache.ts';
import type { ApiResult } from '@dashboard/shared';

export type Params = Record<string, string | undefined>;
type FetchFn<T> = (params: Params) => Promise<ApiResult<T>>;
type CacheKeyFn = (params: Params) => string;
type OnRefreshFn = () => void | Promise<void>;

/**
 * Reads the request's input as a flat params map.
 * `GET` reads URL query params; every other verb reads a JSON body.
 * Both are normalized to `Record<string, string | undefined>` so `cacheKeyFn`
 * and `fetchFn` don't have to know which slot the input arrived in.
 */
export async function extractParams(c: Context): Promise<Params> {
  if (c.req.method === 'GET') {
    return c.req.query();
  }
  try {
    const body: unknown = await c.req.json();
    if (body !== null && typeof body === 'object' && !Array.isArray(body)) {
      const params: Params = {};
      for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
        if (typeof v === 'string') {
          params[k] = v;
        } else if (typeof v === 'number' || typeof v === 'boolean') {
          params[k] = String(v);
        } else if (Array.isArray(v)) {
          params[k] = v.join(',');
        }
      }
      return params;
    }
  } catch {
    // no body — fall through to empty params
  }
  return {};
}

export function createCachedRoute<T>(
  fetchFn: FetchFn<T>,
  ttlMs: number,
  cacheKeyFn: CacheKeyFn,
  onRefresh?: OnRefreshFn,
): Hono {
  const cache = new TTLCache<T>(ttlMs);

  return new Hono()
    .get('/', async (c) => {
      const params = await extractParams(c);
      const key = cacheKeyFn(params);
      const cached = cache.get(key);
      if (cached) return c.json({ ok: true, data: cached });

      const result = await fetchFn(params);
      if (result.ok) cache.set(key, result.data);
      return c.json(result);
    })
    .post('/refresh', async (c) => {
      const params = await extractParams(c);
      const key = cacheKeyFn(params);
      cache.delete(key);

      if (onRefresh) {
        await onRefresh();
      }

      const result = await fetchFn(params);
      if (result.ok) cache.set(key, result.data);
      return c.json(result);
    });
}
