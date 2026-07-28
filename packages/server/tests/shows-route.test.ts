import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createShowsRoute } from '../src/routes/shows.ts';
import { ok, type ApiResult } from '@dashboard/shared';
import type { ShowSearchResult, ShowsData } from '@dashboard/shared';

function createApp(route: ReturnType<typeof createShowsRoute>): Hono {
  return new Hono().route('/api/shows', route);
}

const mockSearchResults: ShowSearchResult[] = [
  {
    id: 169,
    name: 'Breaking Bad',
    status: 'Ended',
    premiered: '2008-01-20',
    network: { name: 'AMC' },
  },
  {
    id: 46562,
    name: 'The Last of Us',
    status: 'Running',
    network: { name: 'HBO' },
  },
];

const mockUpcoming: ShowsData = {
  upcoming: [
    {
      showId: 46562,
      showName: 'The Last of Us',
      season: 3,
      number: 1,
      title: 'New Beginning',
      airdate: '2026-08-15',
      airtime: '21:00',
      runtime: 60,
    },
  ],
  updatedAt: '2026-07-28T00:00:00.000Z',
};

describe('createShowsRoute', () => {
  let searchShows: ReturnType<typeof vi.fn>;
  let getUpcoming: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    searchShows = vi.fn().mockResolvedValue(ok(mockSearchResults));
    getUpcoming = vi.fn().mockImplementation((ids: number[]) => {
      if (ids.length === 0) {
        return Promise.resolve(ok({ upcoming: [], updatedAt: new Date().toISOString() }));
      }
      return Promise.resolve(ok(mockUpcoming));
    });
  });

  describe('GET /search', () => {
    it('calls searchShows with query param', async () => {
      const route = createShowsRoute(searchShows, getUpcoming);
      const app = createApp(route);

      await app.request('/api/shows/search?q=breaking');

      expect(searchShows).toHaveBeenCalledWith('breaking');
    });

    it('returns search results', async () => {
      const route = createShowsRoute(searchShows, getUpcoming);
      const app = createApp(route);

      const res = await app.request('/api/shows/search?q=girls');
      const json = await res.json();

      expect(json.ok).toBe(true);
      expect(json.data).toEqual(mockSearchResults);
    });

    it('handles empty query', async () => {
      const route = createShowsRoute(searchShows, getUpcoming);
      const app = createApp(route);

      await app.request('/api/shows/search');

      expect(searchShows).toHaveBeenCalledWith('');
    });

    it('does not cache search results', async () => {
      const route = createShowsRoute(searchShows, getUpcoming);
      const app = createApp(route);

      await app.request('/api/shows/search?q=girls');
      await app.request('/api/shows/search?q=girls');

      expect(searchShows).toHaveBeenCalledTimes(2);
    });
  });

  describe('GET /upcoming', () => {
    it('parses comma-separated ids', async () => {
      const route = createShowsRoute(searchShows, getUpcoming);
      const app = createApp(route);

      await app.request('/api/shows/upcoming?ids=46562,169');

      expect(getUpcoming).toHaveBeenCalledWith([46562, 169]);
    });

    it('returns upcoming episodes', async () => {
      const route = createShowsRoute(searchShows, getUpcoming);
      const app = createApp(route);

      const res = await app.request('/api/shows/upcoming?ids=46562');
      const json = await res.json();

      expect(json.ok).toBe(true);
      expect(json.data).toEqual(mockUpcoming);
    });

    it('returns empty array for empty ids', async () => {
      const route = createShowsRoute(searchShows, getUpcoming);
      const app = createApp(route);

      const res = await app.request('/api/shows/upcoming');
      const json = await res.json();

      expect(json.ok).toBe(true);
      expect(json.data.upcoming).toEqual([]);
    });

    it('filters out non-numeric ids', async () => {
      const route = createShowsRoute(searchShows, getUpcoming);
      const app = createApp(route);

      await app.request('/api/shows/upcoming?ids=abc,46562,xyz');

      expect(getUpcoming).toHaveBeenCalledWith([46562]);
    });

    it('sorts ids for cache key consistency', async () => {
      const route = createShowsRoute(searchShows, getUpcoming);
      const app = createApp(route);

      await app.request('/api/shows/upcoming?ids=46562,169');
      await app.request('/api/shows/upcoming?ids=169,46562');

      expect(getUpcoming).toHaveBeenCalledTimes(1);
    });

    it('caches results by sorted ids', async () => {
      const route = createShowsRoute(searchShows, getUpcoming);
      const app = createApp(route);

      await app.request('/api/shows/upcoming?ids=46562');
      await app.request('/api/shows/upcoming?ids=46562');

      expect(getUpcoming).toHaveBeenCalledTimes(1);
    });

    it('POST /refresh busts cache', async () => {
      const freshData: ShowsData = {
        upcoming: [
          {
            showId: 46562,
            showName: 'The Last of Us',
            season: 3,
            number: 2,
            title: 'Episode 2',
            airdate: '2026-08-22',
            airtime: '21:00',
            runtime: 60,
          },
        ],
        updatedAt: '2026-07-28T01:00:00.000Z',
      };
      getUpcoming
        .mockResolvedValueOnce(ok(mockUpcoming))
        .mockResolvedValueOnce(ok(freshData));

      const route = createShowsRoute(searchShows, getUpcoming);
      const app = createApp(route);

      await app.request('/api/shows/upcoming?ids=46562');
      const postRes = await app.request('/api/shows/upcoming/refresh?ids=46562', { method: 'POST' });
      const postJson = await postRes.json();
      expect(postJson.data.upcoming[0].number).toBe(2);

      const getRes = await app.request('/api/shows/upcoming?ids=46562');
      const getJson = await getRes.json();
      expect(getJson.data.upcoming[0].number).toBe(2);
      expect(getUpcoming).toHaveBeenCalledTimes(2);
    });
  });
});
