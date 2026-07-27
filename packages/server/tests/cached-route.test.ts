import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { createCachedRoute } from '../src/routes/cached-route.ts';
import { ok, err, type ApiResult } from '@dashboard/shared';

function createApp(route: ReturnType<typeof createCachedRoute>): Hono {
  return new Hono().route('/api/test', route);
}

describe('createCachedRoute', () => {
  let fetchFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchFn = vi.fn();
  });

  it('returns data from fetch on cache miss', async () => {
    fetchFn.mockResolvedValue(ok({ value: 'hello' }));
    const route = createCachedRoute(fetchFn, 60_000, () => 'key');
    const app = createApp(route);

    const res = await app.request('/api/test');
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.data).toEqual({ value: 'hello' });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('returns cached data on subsequent GET without calling fetch again', async () => {
    fetchFn.mockResolvedValue(ok({ value: 'hello' }));
    const route = createCachedRoute(fetchFn, 60_000, () => 'key');
    const app = createApp(route);

    await app.request('/api/test');
    await app.request('/api/test');

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('re-fetches after TTL expires', async () => {
    fetchFn
      .mockResolvedValueOnce(ok({ value: 'first' }))
      .mockResolvedValueOnce(ok({ value: 'second' }));
    const route = createCachedRoute(fetchFn, 10_000, () => 'key');
    const app = createApp(route);

    const res1 = await app.request('/api/test');
    const json1 = await res1.json();
    expect(json1.data).toEqual({ value: 'first' });

    vi.advanceTimersByTime(11_000);

    const res2 = await app.request('/api/test');
    const json2 = await res2.json();
    expect(json2.data).toEqual({ value: 'second' });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('POST busts cache and re-fetches', async () => {
    fetchFn
      .mockResolvedValueOnce(ok({ value: 'cached' }))
      .mockResolvedValueOnce(ok({ value: 'fresh' }));
    const route = createCachedRoute(fetchFn, 60_000, () => 'key');
    const app = createApp(route);

    await app.request('/api/test');
    const postRes = await app.request('/api/test/refresh', { method: 'POST' });
    const postJson = await postRes.json();
    expect(postJson.data).toEqual({ value: 'fresh' });

    const getRes = await app.request('/api/test');
    const getJson = await getRes.json();
    expect(getJson.data).toEqual({ value: 'fresh' });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('does not cache error results', async () => {
    fetchFn
      .mockResolvedValueOnce(err('something broke'))
      .mockResolvedValueOnce(ok({ value: 'recovered' }));
    const route = createCachedRoute(fetchFn, 60_000, () => 'key');
    const app = createApp(route);

    const res1 = await app.request('/api/test');
    const json1 = await res1.json();
    expect(json1.ok).toBe(false);
    expect(json1.error).toBe('something broke');

    const res2 = await app.request('/api/test');
    const json2 = await res2.json();
    expect(json2.ok).toBe(true);
    expect(json2.data).toEqual({ value: 'recovered' });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('uses cache-key function to generate distinct cache entries', async () => {
    fetchFn
      .mockResolvedValueOnce(ok({ city: 'A' }))
      .mockResolvedValueOnce(ok({ city: 'B' }));
    let callCount = 0;
    const route = createCachedRoute(fetchFn, 60_000, () => `key-${++callCount}`);
    const app = createApp(route);

    const res1 = await app.request('/api/test?city=A');
    const json1 = await res1.json();
    expect(json1.data).toEqual({ city: 'A' });

    const res2 = await app.request('/api/test?city=B');
    const json2 = await res2.json();
    expect(json2.data).toEqual({ city: 'B' });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('passes Hono context to the fetch function', async () => {
    fetchFn.mockResolvedValue(ok({ ok: true }));
    const route = createCachedRoute(fetchFn, 60_000, () => 'key');
    const app = createApp(route);

    await app.request('/api/test?foo=bar');

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const ctx = fetchFn.mock.calls[0][0];
    expect(ctx.req.query('foo')).toBe('bar');
  });
});
