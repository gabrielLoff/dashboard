import { Hono } from 'hono';
import { fetchWeather } from '../connectors/weather.ts';
import { TTLCache } from '../cache.ts';
import type { WeatherData } from '@dashboard/shared';

const TTL = Number(process.env.CACHE_TTL_WEATHER) * 1000 || 600_000;
const cache = new TTLCache<WeatherData>(TTL);

export const weatherRoute = new Hono()
  .get('/', async (c) => {
    const cached = cache.get('weather');
    if (cached) return c.json({ ok: true, data: cached });

    const location = c.req.query('location') ?? 'Porto Alegre';
    const result = await fetchWeather(location);

    if (result.ok) {
      cache.set('weather', result.data);
    }

    return c.json(result);
  })
  .post('/refresh', async (c) => {
    cache.delete('weather');
    const location = c.req.query('location') ?? 'Porto Alegre';
    const result = await fetchWeather(location);

    if (result.ok) {
      cache.set('weather', result.data);
    }

    return c.json(result);
  });
