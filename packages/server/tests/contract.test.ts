import { describe, it, expect, beforeAll, vi } from 'vitest';
import { Hono } from 'hono';
import { createApp, type AppDeps } from '../src/app.ts';
import { ENDPOINT_META, type EndpointKey, type Endpoints } from '@dashboard/shared';
import { isOk } from '@dashboard/shared';
import { getDb } from '../src/db.ts';
import { getMockWeather, getMockNews, getMockAgenda, getMockGames, getMockShows, getMockShowsUpcoming } from '../src/mock-data.ts';
import type {
  ApiResult,
  WeatherData,
  NewsData,
  AgendaData,
  FreeGamesData,
  ShowSearchResult,
  ShowsData,
  EpisodeListEntry,
} from '@dashboard/shared';

function stubDeps(): AppDeps {
  return {
    fetchWeather: vi.fn(async () => getMockWeather()),
    fetchWeatherByCoords: vi.fn(async () => getMockWeather()),
    fetchNews: vi.fn(async () => getMockNews()),
    fetchAgenda: vi.fn(async () => getMockAgenda()),
    fetchGames: vi.fn(async () => getMockGames()),
    searchShows: vi.fn(async () => getMockShows()),
    getUpcomingEpisodes: vi.fn(async () => getMockShowsUpcoming()),
    fetchEpisodes: vi.fn(async (): Promise<ApiResult<EpisodeListEntry[]>> => ({ ok: true, data: [] })),
  };
}

/** Sample input per endpoint, for the response-shape half of the contract. */
const SAMPLE_INPUT: Partial<Record<EndpointKey, unknown>> = {
  'GET /api/weather': { lat: 1, lon: 2 },
  'POST /api/weather/refresh': { lat: 1, lon: 2 },
  'GET /api/news': { country: 'us' },
  'POST /api/news/refresh': { country: 'us' },
  'GET /api/games': { platform: 'pc' },
  'POST /api/games/refresh': { platform: 'pc' },
  'GET /api/shows/search': { q: 'test' },
  'GET /api/shows/upcoming': { ids: [1, 2] },
  'POST /api/shows/upcoming/refresh': { ids: [1, 2] },
  'GET /api/shows/episodes': { id: 1 },
  'PUT /api/sync/habits': { habits: [] },
  'PUT /api/sync/watchlist': { entries: [] },
  'PUT /api/sync/progress': { progress: [] },
};

function splitKey(key: EndpointKey): { verb: string; path: string } {
  const idx = key.indexOf(' ');
  return { verb: key.slice(0, idx), path: key.slice(idx + 1) };
}

function toSearchParams(input: unknown): string {
  if (input == null || typeof input !== 'object') return '';
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (v === undefined || v === null) continue;
    params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

function isApiResult(value: unknown): value is ApiResult<unknown> {
  if (value === null || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.ok !== 'boolean') return false;
  if (v.ok) return 'data' in v;
  return typeof v.error === 'string';
}

describe('client-server contract', () => {
  let app: Hono;

  beforeAll(() => {
    const db = getDb();
    db.prepare('DELETE FROM habits').run();
    db.prepare('DELETE FROM watchlist').run();
    db.prepare('DELETE FROM episode_progress').run();
    app = createApp(stubDeps());
  });

  describe('every endpoint in the contract has a registered route', () => {
    it('registers a route for every key of Endpoints', () => {
      const registered = new Set(
        app.routes.map((r) => `${r.method} ${r.path.replace(/\/$/, '')}`),
      );

      const missing = (Object.keys(ENDPOINT_META) as EndpointKey[]).filter(
        (key) => !registered.has(key),
      );

      expect(missing).toEqual([]);
    });

    it('registers no route that the contract does not declare (except /api/health)', () => {
      const declared = new Set(Object.keys(ENDPOINT_META) as EndpointKey[]);
      const allowlist = new Set(['GET /api/health']);

      const undeclared = app.routes
        .filter((r) => r.method !== 'ALL')
        .map((r) => `${r.method} ${r.path.replace(/\/$/, '')}`)
        .filter((key) => !declared.has(key) && !allowlist.has(key));

      expect(undeclared).toEqual([]);
    });
  });

  describe('every endpoint responds with a well-formed ApiResult', () => {
    const keys = Object.keys(ENDPOINT_META) as EndpointKey[];

    for (const key of keys) {
      it(`${key} returns ApiResult`, async () => {
        const { verb, path } = splitKey(key);
        const input = SAMPLE_INPUT[key];
        const isGet = verb === 'GET';

        const url = isGet ? `${path}${toSearchParams(input)}` : path;
        const init: RequestInit = { method: verb };
        if (!isGet && input !== undefined) {
          init.headers = { 'Content-Type': 'application/json' };
          init.body = JSON.stringify(input);
        }

        const res = await app.request(url, init);
        const json: unknown = await res.json();

        expect(isApiResult(json)).toBe(true);
        if (isApiResult(json)) {
          expect(isOk(json)).toBe(true);
        }
      });
    }
  });

  describe('GET /api/sync returns SyncData', () => {
    it('has habits, watchlist, and progress arrays', async () => {
      const res = await app.request('/api/sync');
      const json = (await res.json()) as ApiResult<Endpoints['GET /api/sync']['res']>;

      expect(isOk(json)).toBe(true);
      if (isOk(json)) {
        expect(Array.isArray(json.data.habits)).toBe(true);
        expect(Array.isArray(json.data.watchlist)).toBe(true);
        expect(Array.isArray(json.data.progress)).toBe(true);
      }
    });
  });

  describe('write endpoints return a data slot', () => {
    it('PUT /api/sync/habits returns { ok: true, data: null }', async () => {
      const res = await app.request('/api/sync/habits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habits: [] }),
      });
      const json = (await res.json()) as ApiResult<null>;

      expect(json).toEqual({ ok: true, data: null });
    });
  });
});
