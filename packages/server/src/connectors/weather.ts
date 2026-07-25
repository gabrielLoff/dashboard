import type { ApiResult, WeatherData } from '@dashboard/shared';
import { err, getWeatherCondition } from '@dashboard/shared';
import { isMockMode, getMockWeather } from '../mock-data.ts';

interface GeocodingResult {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
}

interface OpenMeteoCurrent {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  wind_speed_10m: number;
  weather_code: number;
}

interface OpenMeteoResponse {
  current: OpenMeteoCurrent;
}

async function geocode(city: string): Promise<ApiResult<GeocodingResult>> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    const res = await fetch(url);

    if (!res.ok) {
      return err(`Geocoding failed: ${res.status}`);
    }

    const json = (await res.json()) as { results?: GeocodingResult[] };

    if (!json.results?.length) {
      return err(`Location not found: ${city}`);
    }

    return { ok: true, data: json.results[0] };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Geocoding request failed');
  }
}

function buildWeatherData(name: string, current: OpenMeteoCurrent): WeatherData {
  const condition = getWeatherCondition(current.weather_code);

  return {
    location: name,
    temperature: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    humidity: current.relative_humidity_2m,
    condition: condition.description,
    icon: condition.icon,
    windSpeed: Math.round(current.wind_speed_10m),
    updatedAt: new Date().toISOString(),
  };
}

async function fetchForecast(lat: number, lon: number): Promise<ApiResult<OpenMeteoCurrent>> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);

  if (!res.ok) {
    return err(`Open-Meteo returned ${res.status}: ${res.statusText}`);
  }

  const json = (await res.json()) as OpenMeteoResponse;
  return { ok: true, data: json.current };
}

export async function fetchWeather(location: string): Promise<ApiResult<WeatherData>> {
  if (isMockMode()) {
    return getMockWeather();
  }

  const geoResult = await geocode(location);
  if (!geoResult.ok) return geoResult;

  const { latitude, longitude, name } = geoResult.data;

  try {
    const forecastResult = await fetchForecast(latitude, longitude);
    if (!forecastResult.ok) return forecastResult;

    return { ok: true, data: buildWeatherData(name, forecastResult.data) };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to fetch weather');
  }
}

export async function fetchWeatherByCoords(lat: number, lon: number): Promise<ApiResult<WeatherData>> {
  if (isMockMode()) {
    return getMockWeather();
  }

  try {
    const forecastResult = await fetchForecast(lat, lon);
    if (!forecastResult.ok) return forecastResult;

    return { ok: true, data: buildWeatherData(`${lat.toFixed(2)}, ${lon.toFixed(2)}`, forecastResult.data) };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to fetch weather by coordinates');
  }
}
