import type { ApiResult, WeatherData, ForecastDay } from '@dashboard/shared';
import { err, getWeatherCondition } from '@dashboard/shared';

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

interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  weather_code: number[];
}

interface OpenMeteoResponse {
  current: OpenMeteoCurrent;
  daily: OpenMeteoDaily;
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

function buildWeatherData(name: string, current: OpenMeteoCurrent, daily: OpenMeteoDaily): WeatherData {
  const condition = getWeatherCondition(current.weather_code);

  const forecast: ForecastDay[] = daily.time.slice(0, 5).map((date, i) => {
    const dayCondition = getWeatherCondition(daily.weather_code[i]);
    return {
      date,
      high: Math.round(daily.temperature_2m_max[i]),
      low: Math.round(daily.temperature_2m_min[i]),
      condition: dayCondition.description,
      icon: dayCondition.icon,
    };
  });

  return {
    location: name,
    temperature: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    humidity: current.relative_humidity_2m,
    condition: condition.description,
    icon: condition.icon,
    windSpeed: Math.round(current.wind_speed_10m),
    forecast,
    updatedAt: new Date().toISOString(),
  };
}

async function fetchForecast(lat: number, lon: number): Promise<ApiResult<OpenMeteoResponse>> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code',
    forecast_days: '5',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);

  if (!res.ok) {
    return err(`Open-Meteo returned ${res.status}: ${res.statusText}`);
  }

  const json = (await res.json()) as OpenMeteoResponse;
  return { ok: true, data: json };
}

export async function fetchWeather(location: string): Promise<ApiResult<WeatherData>> {
  const geoResult = await geocode(location);
  if (!geoResult.ok) return geoResult;

  const { latitude, longitude, name } = geoResult.data;

  try {
    const forecastResult = await fetchForecast(latitude, longitude);
    if (!forecastResult.ok) return forecastResult;

    return { ok: true, data: buildWeatherData(name, forecastResult.data.current, forecastResult.data.daily) };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to fetch weather');
  }
}

export async function fetchWeatherByCoords(lat: number, lon: number): Promise<ApiResult<WeatherData>> {
  try {
    const forecastResult = await fetchForecast(lat, lon);
    if (!forecastResult.ok) return forecastResult;

    return { ok: true, data: buildWeatherData(`${lat.toFixed(2)}, ${lon.toFixed(2)}`, forecastResult.data.current, forecastResult.data.daily) };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to fetch weather by coordinates');
  }
}