import { createCachedRoute } from './cached-route.ts';
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
  fetchWeather_: (loc: string) => Promise<ApiResult<WeatherData>>,
  fetchWeatherByCoords_: (lat: number, lon: number) => Promise<ApiResult<WeatherData>>,
): Promise<ApiResult<WeatherData>> {
  const lat = ctx.req.query('lat');
  const lon = ctx.req.query('lon');
  if (lat !== undefined && lon !== undefined) {
    return fetchWeatherByCoords_(Number(lat), Number(lon));
  }
  const location = ctx.req.query('location') ?? 'Porto Alegre';
  return fetchWeather_(location);
}

export function createWeatherRoute(
  fetchWeather_: (loc: string) => Promise<ApiResult<WeatherData>>,
  fetchWeatherByCoords_: (lat: number, lon: number) => Promise<ApiResult<WeatherData>>,
) {
  return createCachedRoute(
    (ctx) => fetchFn(ctx, fetchWeather_, fetchWeatherByCoords_),
    TTL,
    cacheKey,
  );
}