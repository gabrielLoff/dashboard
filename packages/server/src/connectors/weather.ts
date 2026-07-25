import type { ApiResult, WeatherData } from '@dashboard/shared';
import { err } from '@dashboard/shared';
import { isMockMode, getMockWeather } from '../mock-data.ts';

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export async function fetchWeather(location: string): Promise<ApiResult<WeatherData>> {
  if (isMockMode() || !API_KEY) {
    return getMockWeather();
  }

  try {
    const res = await fetch(
      `${BASE_URL}/weather?q=${encodeURIComponent(location)}&appid=${API_KEY}&units=metric`,
    );

    if (!res.ok) {
      return err(`OpenWeatherMap returned ${res.status}: ${res.statusText}`);
    }

    const json = (await res.json()) as {
      name: string;
      main: { temp: number; feels_like: number; humidity: number };
      weather: { description: string; icon: string }[];
      wind: { speed: number };
      dt: number;
    };

    return {
      ok: true,
      data: {
        location: json.name,
        temperature: Math.round(json.main.temp),
        feelsLike: Math.round(json.main.feels_like),
        humidity: json.main.humidity,
        condition: json.weather[0]?.description ?? 'Unknown',
        icon: json.weather[0]?.icon ?? '',
        windSpeed: Math.round(json.wind.speed),
        updatedAt: new Date(json.dt * 1000).toISOString(),
      },
    };
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to fetch weather');
  }
}
