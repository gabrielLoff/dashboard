import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { request, ENDPOINT_META, type Endpoints, type EndpointInput } from '../src/endpoints.ts';
import { isOk, isErr, type ApiResult } from '../src/result.ts';
import type { NewsData, NewsFilters } from '../src/api-types.ts';

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('request', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('GET renders input as query params', () => {
    it('calls fetch with the endpoint path and query string', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true, data: { items: [], updatedAt: 'x' } }));

      const filters: NewsFilters = { country: 'us', category: 'general' };
      await request('GET /api/news', filters);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/news?country=us&category=general');
    });

    it('omits undefined values from the query string', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true, data: { items: [], updatedAt: 'x' } }));

      await request('GET /api/news', { country: 'us', category: undefined });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/news?country=us');
    });

    it('calls fetch with just the path when the endpoint has no input', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true, data: { events: [], updatedAt: 'x' } }));

      await request('GET /api/agenda');

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/agenda');
    });

    it('encodes input values into the query string', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true, data: { items: [], updatedAt: 'x' } }));

      await request('GET /api/news', { country: 'br' });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/news?country=br');
    });
  });

  describe('non-GET renders input as a JSON body', () => {
    it('sends a JSON body on PUT', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

      await request('PUT /api/sync/habits', { habits: [] });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/sync/habits');
      expect(init.method).toBe('PUT');
      expect(init.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(init.body)).toEqual({ habits: [] });
    });

    it('sends a JSON body on POST refresh', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true, data: { items: [], updatedAt: 'x' } }));

      await request('POST /api/news/refresh', { country: 'it' });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/news/refresh');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({ country: 'it' });
    });

    it('sends no body when the endpoint has no input', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

      await request('PUT /api/sync/watchlist', { entries: [] });

      const [, init] = fetchMock.mock.calls[0];
      expect(init.body).toBeDefined();
    });
  });

  describe('returns ApiResult and never throws', () => {
    it('passes through a well-formed ok body', async () => {
      const body: ApiResult<NewsData> = { ok: true, data: { items: [], updatedAt: 'x' } };
      fetchMock.mockResolvedValue(jsonResponse(body));

      const result = await request('GET /api/news');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.data.items).toEqual([]);
      }
    });

    it('passes through a well-formed err body', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: false, error: 'upstream down' }, 502));

      const result = await request('GET /api/news');
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe('upstream down');
      }
    });

    it('returns err when fetch rejects', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      const result = await request('GET /api/news');
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe('Network error');
      }
    });

    it('returns err when the body is not JSON', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 502,
        json: () => Promise.reject(new SyntaxError('Unexpected token <')),
      } as unknown as Response);

      const result = await request('GET /api/news');
      expect(isErr(result)).toBe(true);
    });

    it('returns err when the body is JSON but not an ApiResult', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ error: 'Internal Server Error' }, 500));

      const result = await request('GET /api/news');
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toContain('GET /api/news');
      }
    });

    it('returns err when the body is a JSON scalar', async () => {
      fetchMock.mockResolvedValue(jsonResponse('not an object', 200));

      const result = await request('GET /api/news');
      expect(isErr(result)).toBe(true);
    });

    it('returns err when fetch rejects with a non-Error', async () => {
      fetchMock.mockRejectedValue('boom');

      const result = await request('GET /api/news');
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe('boom');
      }
    });

    it('returns err when reading input for the query string throws', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true, data: { items: [], updatedAt: 'x' } }));

      const hostile = {
        get country(): string {
          throw new Error('country getter exploded');
        },
      };
      const result = await request('GET /api/news', hostile);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe('country getter exploded');
      }
    });

    it('returns err when body serialization throws', async () => {
      const fetchMockLocal = fetchMock;
      const hostile = {
        habits: [],
        toJSON(): never {
          throw new Error('toJSON exploded');
        },
      };
      const result = await request(
        'PUT /api/sync/habits',
        hostile as unknown as EndpointInput<'PUT /api/sync/habits'>,
      );

      expect(fetchMockLocal).not.toHaveBeenCalled();
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe('toJSON exploded');
      }
    });
  });

  describe('cache identity', () => {
    it('exposes the invalidation prefix per endpoint', () => {
      expect(ENDPOINT_META['GET /api/news'].cachePrefix).toEqual(['dashboard', 'news']);
      expect(ENDPOINT_META['GET /api/agenda'].cachePrefix).toEqual(['dashboard', 'agenda']);
      expect(ENDPOINT_META['GET /api/sync'].cachePrefix).toEqual(['dashboard', 'sync']);
    });

    it('derives the cache key from the input with defaults', () => {
      const { cacheKey } = ENDPOINT_META['GET /api/news'];

      expect(cacheKey({ country: 'us', category: 'tech' })).toEqual(['dashboard', 'news', 'us', 'tech']);
      expect(cacheKey(undefined)).toEqual(['dashboard', 'news', 'all', 'general']);
      expect(cacheKey({})).toEqual(['dashboard', 'news', 'all', 'general']);
    });

    it('pairs a read endpoint with its cache-bust', () => {
      expect(ENDPOINT_META['GET /api/news'].refresh).toBe('POST /api/news/refresh');
      expect(ENDPOINT_META['GET /api/weather'].refresh).toBe('POST /api/weather/refresh');
      expect(ENDPOINT_META['GET /api/agenda'].refresh).toBe('POST /api/agenda/refresh');
    });

    it('omits the cache-bust for writes and uncacheable reads', () => {
      expect(ENDPOINT_META['GET /api/sync'].refresh).toBeUndefined();
      expect(ENDPOINT_META['PUT /api/sync/habits'].refresh).toBeUndefined();
      expect(ENDPOINT_META['GET /api/shows/search'].refresh).toBeUndefined();
    });

    it('declares cache identity for every endpoint in the contract', () => {
      const keys = Object.keys(ENDPOINT_META) as Array<keyof Endpoints>;
      expect(keys.length).toBeGreaterThan(0);
      for (const k of keys) {
        expect(ENDPOINT_META[k]).toHaveProperty('cachePrefix');
        expect(ENDPOINT_META[k]).toHaveProperty('cacheKey');
      }
    });
  });
});
