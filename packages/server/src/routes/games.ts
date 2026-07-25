import { Hono } from 'hono';
import { fetchGames } from '../connectors/games.ts';
import { TTLCache } from '../cache.ts';
import type { FreeGamesData } from '@dashboard/shared';

const TTL = Number(process.env.CACHE_TTL_GAMES) * 1000 || 7_200_000;
const cache = new TTLCache<FreeGamesData>(TTL);

export const gamesRoute = new Hono()
  .get('/', async (c) => {
    const cached = cache.get('games');
    if (cached) return c.json({ ok: true, data: cached });

    const result = await fetchGames();
    if (result.ok) {
      cache.set('games', result.data);
    }
    return c.json(result);
  })
  .post('/refresh', async (c) => {
    cache.delete('games');
    const result = await fetchGames();
    if (result.ok) {
      cache.set('games', result.data);
    }
    return c.json(result);
  });
