import { Hono } from 'hono';
import { fetchWeather } from '../connectors/weather.ts';
import { TTLCache } from '../cache.ts';
import type { WeatherData } from '@dashboard/shared';

const TTL = Number(process.env.CACHE_TTL_WEATHER) * 1000 || 600_000;
const cache = new TTLCache<WeatherData>(TTL);

function cacheKey(location: string): string {
  return `weather:${location.toLowerCase().trim()}`;
}

export const weatherRoute = new Hono()
  .get('/', async (c) => {
    const location = c.req.query('location') ?? 'Porto Alegre';
    const key = cacheKey(location);
    const cached = cache.get(key);
    if (cached) return c.json({ ok: true, data: cached });

    const result = await fetchWeather(location);

    if (result.ok) {
      cache.set(key, result.data);
    }

    return c.json(result);
  })
  .post('/refresh', async (c) => {
    const location = c.req.query('location') ?? 'Porto Alegre';
    const key = cacheKey(location);
    cache.delete(key);
    const result = await fetchWeather(location);

    if (result.ok) {
      cache.set(key, result.data);
    }

    return c.json(result);
  });
