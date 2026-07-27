import { createCachedRoute } from './cached-route.ts';
import { fetchWeather, fetchWeatherByCoords } from '../connectors/weather.ts';
import type { ApiResult, WeatherData } from '@dashboard/shared';

const TTL = Number(process.env.CACHE_TTL_WEATHER) * 1000 || 600_000;

function cacheKey(
  ctx: { req: { query: (key: string) => string | undefined } },
): string {
  const lat = ctx.req.query('lat');
  const lon = ctx.req.query('lon');
  if (lat !== undefined && lon !== undefined) {
    return `weather:${Number(lat).toFixed(2)}:${Number(lon).toFixed(2)}`;
  }
  const location = ctx.req.query('location') ?? 'Porto Alegre';
  return `weather:${location.toLowerCase().trim()}`;
}

async function fetchFn(
  ctx: { req: { query: (key: string) => string | undefined } },
): Promise<ApiResult<WeatherData>> {
  const lat = ctx.req.query('lat');
  const lon = ctx.req.query('lon');
  if (lat !== undefined && lon !== undefined) {
    return fetchWeatherByCoords(Number(lat), Number(lon));
  }
  const location = ctx.req.query('location') ?? 'Porto Alegre';
  return fetchWeather(location);
}

export const weatherRoute = createCachedRoute(fetchFn, TTL, cacheKey);
