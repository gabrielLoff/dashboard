import { createCachedRoute, type Params } from './cached-route.ts';
import type { ApiResult, WeatherData } from '@dashboard/shared';

const TTL = Number(process.env.CACHE_TTL_WEATHER) * 1000 || 600_000;

function cacheKey(params: Params): string {
  const lat = params.lat;
  const lon = params.lon;
  if (lat !== undefined && lon !== undefined) {
    return `weather:${Number(lat).toFixed(2)}:${Number(lon).toFixed(2)}`;
  }
  const location = params.location ?? 'Porto Alegre';
  return `weather:${location.toLowerCase().trim()}`;
}

async function fetchFn(
  params: Params,
  fetchWeather_: (loc: string) => Promise<ApiResult<WeatherData>>,
  fetchWeatherByCoords_: (lat: number, lon: number) => Promise<ApiResult<WeatherData>>,
): Promise<ApiResult<WeatherData>> {
  const lat = params.lat;
  const lon = params.lon;
  if (lat !== undefined && lon !== undefined) {
    return fetchWeatherByCoords_(Number(lat), Number(lon));
  }
  const location = params.location ?? 'Porto Alegre';
  return fetchWeather_(location);
}

export function createWeatherRoute(
  fetchWeather_: (loc: string) => Promise<ApiResult<WeatherData>>,
  fetchWeatherByCoords_: (lat: number, lon: number) => Promise<ApiResult<WeatherData>>,
) {
  return createCachedRoute(
    (params) => fetchFn(params, fetchWeather_, fetchWeatherByCoords_),
    TTL,
    cacheKey,
  );
}
