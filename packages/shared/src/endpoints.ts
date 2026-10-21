import { err, type ApiResult } from './result';
import type {
  WeatherData,
  NewsData,
  NewsFilters,
  AgendaData,
  FreeGamesData,
  GamesFilters,
  ShowSearchResult,
  ShowsData,
  EpisodeListEntry,
  EpisodeProgress,
  Habit,
  WatchlistEntry,
  SyncData,
} from './api-types';

export interface WeatherArgs {
  lat?: number;
  lon?: number;
  location?: string;
}

/**
 * The wire contract. Keys are `verb + path` — the key *is* the URL.
 *
 * Each entry declares the input shape (`input`, omitted when the endpoint
 * takes none) and the response shape (`res`). Cache identity lives in
 * `ENDPOINT_META` below, keyed by the same strings.
 */
export interface Endpoints {
  'GET /api/weather': { input: WeatherArgs; res: WeatherData; refresh: 'POST /api/weather/refresh' };
  'POST /api/weather/refresh': { input: WeatherArgs; res: WeatherData };

  'GET /api/news': { input: NewsFilters; res: NewsData; refresh: 'POST /api/news/refresh' };
  'POST /api/news/refresh': { input: NewsFilters; res: NewsData };

  'GET /api/agenda': { res: AgendaData; refresh: 'POST /api/agenda/refresh' };
  'POST /api/agenda/refresh': { res: AgendaData };

  'GET /api/games': { input: GamesFilters; res: FreeGamesData; refresh: 'POST /api/games/refresh' };
  'POST /api/games/refresh': { input: GamesFilters; res: FreeGamesData };

  'GET /api/shows/search': { input: { q: string }; res: ShowSearchResult[] };
  'GET /api/shows/upcoming': { input: { ids: number[] }; res: ShowsData; refresh: 'POST /api/shows/upcoming/refresh' };
  'POST /api/shows/upcoming/refresh': { input: { ids: number[] }; res: ShowsData };
  'GET /api/shows/episodes': { input: { id: number }; res: EpisodeListEntry[] };

  'GET /api/sync': { res: SyncData };

  'PUT /api/sync/habits': { input: { habits: Habit[] }; res: null };
  'PUT /api/sync/watchlist': { input: { entries: WatchlistEntry[] }; res: null };
  'PUT /api/sync/progress': { input: { progress: EpisodeProgress[] }; res: null };
}

export type EndpointKey = keyof Endpoints;

export type EndpointInput<K extends EndpointKey> = Endpoints[K] extends { input: infer I }
  ? I
  : undefined;

export type EndpointResponse<K extends EndpointKey> = Endpoints[K]['res'];

interface EndpointMeta<K extends EndpointKey> {
  cachePrefix: readonly unknown[];
  cacheKey: (input?: EndpointInput<K>) => readonly unknown[];
  refresh?: Endpoints[K] extends { refresh: infer R extends EndpointKey } ? R : undefined;
}

/**
 * Cache identity per endpoint. Compiler-enforced exhaustive over `Endpoints`.
 *
 * `cachePrefix` is the invalidation prefix (the leading segment of every cache
 * key for the source). `cacheKey(input)` is the full TanStack cache key.
 * `refresh` names the paired cache-bust endpoint, when one exists.
 */
const weatherCacheKey = (input?: WeatherArgs): readonly unknown[] => {
  if (input?.lat != null && input.lon != null) {
    return ['dashboard', 'weather', input.lat.toFixed(2), input.lon.toFixed(2)];
  }
  if (input?.location) {
    return ['dashboard', 'weather', input.location.toLowerCase().trim()];
  }
  return ['dashboard', 'weather'];
};

const newsCacheKey = (input?: NewsFilters): readonly unknown[] => [
  'dashboard',
  'news',
  input?.country ?? 'all',
  input?.category ?? 'general',
];

const AGENDA_CACHE_KEY = ['dashboard', 'agenda'] as const;
const SYNC_CACHE_KEY = ['dashboard', 'sync'] as const;

const gamesCacheKey = (input?: GamesFilters): readonly unknown[] => [
  'dashboard',
  'games',
  input?.platform ?? 'all',
  input?.type ?? 'all',
  input?.page ?? 1,
];

const upcomingCacheKey = (input?: { ids: number[] }): readonly unknown[] => [
  'dashboard',
  'shows',
  'upcoming',
  ...(input?.ids ?? []).slice().sort((a, b) => a - b),
];

export const ENDPOINT_META: { [K in EndpointKey]: EndpointMeta<K> } = {
  'GET /api/weather': {
    cachePrefix: ['dashboard', 'weather'],
    cacheKey: weatherCacheKey,
    refresh: 'POST /api/weather/refresh',
  },
  'POST /api/weather/refresh': {
    cachePrefix: ['dashboard', 'weather'],
    cacheKey: weatherCacheKey,
  },

  'GET /api/news': {
    cachePrefix: ['dashboard', 'news'],
    cacheKey: newsCacheKey,
    refresh: 'POST /api/news/refresh',
  },
  'POST /api/news/refresh': {
    cachePrefix: ['dashboard', 'news'],
    cacheKey: newsCacheKey,
  },

  'GET /api/agenda': {
    cachePrefix: AGENDA_CACHE_KEY,
    cacheKey: () => AGENDA_CACHE_KEY,
    refresh: 'POST /api/agenda/refresh',
  },
  'POST /api/agenda/refresh': {
    cachePrefix: AGENDA_CACHE_KEY,
    cacheKey: () => AGENDA_CACHE_KEY,
  },

  'GET /api/games': {
    cachePrefix: ['dashboard', 'games'],
    cacheKey: gamesCacheKey,
    refresh: 'POST /api/games/refresh',
  },
  'POST /api/games/refresh': {
    cachePrefix: ['dashboard', 'games'],
    cacheKey: gamesCacheKey,
  },

  'GET /api/shows/search': {
    cachePrefix: ['dashboard', 'shows', 'search'],
    cacheKey: (input?: { q: string }) => ['dashboard', 'shows', 'search', input?.q ?? ''],
  },
  'GET /api/shows/upcoming': {
    cachePrefix: ['dashboard', 'shows', 'upcoming'],
    cacheKey: upcomingCacheKey,
    refresh: 'POST /api/shows/upcoming/refresh',
  },
  'POST /api/shows/upcoming/refresh': {
    cachePrefix: ['dashboard', 'shows', 'upcoming'],
    cacheKey: upcomingCacheKey,
  },
  'GET /api/shows/episodes': {
    cachePrefix: ['dashboard', 'shows', 'episodes'],
    cacheKey: (input?: { id: number }) => ['dashboard', 'shows', 'episodes', input?.id ?? 0],
  },

  'GET /api/sync': {
    cachePrefix: SYNC_CACHE_KEY,
    cacheKey: () => SYNC_CACHE_KEY,
  },

  'PUT /api/sync/habits': {
    cachePrefix: SYNC_CACHE_KEY,
    cacheKey: () => SYNC_CACHE_KEY,
  },
  'PUT /api/sync/watchlist': {
    cachePrefix: SYNC_CACHE_KEY,
    cacheKey: () => SYNC_CACHE_KEY,
  },
  'PUT /api/sync/progress': {
    cachePrefix: SYNC_CACHE_KEY,
    cacheKey: () => SYNC_CACHE_KEY,
  },
};

type Verb<K extends EndpointKey> = K extends `${infer V} ${string}` ? V : never;

function splitKey(key: EndpointKey): { verb: string; path: string } {
  const idx = key.indexOf(' ');
  return { verb: key.slice(0, idx), path: key.slice(idx + 1) };
}

function toSearchParams(input: unknown): string {
  if (input == null || typeof input !== 'object') return '';
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (typeof v === 'string') {
      params.set(k, v);
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      params.set(k, String(v));
    } else if (Array.isArray(v)) {
      params.set(k, v.join(','));
    }
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

/**
 * Crosses the client-server seam. Never throws — every failure mode (fetch
 * rejection, non-JSON body, non-`ApiResult` body) becomes `err(message)`.
 *
 * `GET` sends `input` as query params; every other verb sends it as a JSON body.
 */
export async function request<K extends EndpointKey>(
  key: K,
  input?: EndpointInput<K>,
): Promise<ApiResult<Endpoints[K]['res']>> {
  const { verb, path } = splitKey(key);
  const isGet = verb === 'GET';

  try {
    const url = isGet ? `${path}${toSearchParams(input)}` : path;
    const init: RequestInit = { method: verb };
    if (!isGet && input !== undefined) {
      init.headers = { 'Content-Type': 'application/json' };
      init.body = JSON.stringify(input);
    }

    const res = await fetch(url, init);
    const json: unknown = await res.json();
    if (isApiResult(json)) {
      return json as ApiResult<Endpoints[K]['res']>;
    }
    return err(`Unexpected response from ${key}`);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

export type { Verb };
