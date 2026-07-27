import { Hono } from 'hono';
import { fetchGames, type GamesFilters, VALID_TYPES, VALID_PLATFORMS } from '../connectors/games.ts';
import { TTLCache } from '../cache.ts';
import type { FreeGamesData } from '@dashboard/shared';

const TTL = Number(process.env.CACHE_TTL_GAMES) * 1000 || 7_200_000;
const cache = new TTLCache<FreeGamesData>(TTL);

function parseFilters(query: Record<string, string | undefined>): GamesFilters {
  const filters: GamesFilters = {};

  if (query.type && VALID_TYPES.includes(query.type as typeof VALID_TYPES[number])) {
    filters.type = query.type as GamesFilters['type'];
  }
  if (query.platform && VALID_PLATFORMS.includes(query.platform as typeof VALID_PLATFORMS[number])) {
    filters.platform = query.platform as GamesFilters['platform'];
  }
  if (query.page) {
    const page = parseInt(query.page, 10);
    if (!isNaN(page) && page > 0) filters.page = page;
  }

  return filters;
}

function cacheKey(filters: GamesFilters): string {
  return `games:${filters.platform ?? 'all'}:${filters.type ?? 'all'}:${filters.page ?? 1}`;
}

export const gamesRoute = new Hono()
  .get('/', async (c) => {
    const filters = parseFilters(c.req.query());
    const key = cacheKey(filters);

    const cached = cache.get(key);
    if (cached) return c.json({ ok: true, data: cached });

    const result = await fetchGames(filters);
    if (result.ok) {
      cache.set(key, result.data);
    }
    return c.json(result);
  })
  .post('/refresh', async (c) => {
    const filters = parseFilters(c.req.query());
    const key = cacheKey(filters);

    cache.delete(key);
    const result = await fetchGames(filters);
    if (result.ok) {
      cache.set(key, result.data);
    }
    return c.json(result);
  });
