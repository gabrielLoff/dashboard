import type { ApiResult, WeatherData, NewsData, AgendaData, FreeGamesData } from '@dashboard/shared';

const BASE = '/api';

async function get<T>(url: string): Promise<ApiResult<T>> {
  const res = await fetch(`${BASE}${url}`);
  const json = (await res.json()) as ApiResult<T>;
  return json;
}

async function post<T>(url: string): Promise<ApiResult<T>> {
  const res = await fetch(`${BASE}${url}`, { method: 'POST' });
  const json = (await res.json()) as ApiResult<T>;
  return json;
}

export function fetchWeather(location?: string): Promise<ApiResult<WeatherData>> {
  const query = location ? `?location=${encodeURIComponent(location)}` : '';
  return get<WeatherData>(`/weather${query}`);
}

export function refreshWeather(location?: string): Promise<ApiResult<WeatherData>> {
  const query = location ? `?location=${encodeURIComponent(location)}` : '';
  return post<WeatherData>(`/weather/refresh${query}`);
}

export function fetchWeatherByCoords(lat: number, lon: number): Promise<ApiResult<WeatherData>> {
  return get<WeatherData>(`/weather?lat=${lat}&lon=${lon}`);
}

export function refreshWeatherByCoords(lat: number, lon: number): Promise<ApiResult<WeatherData>> {
  return post<WeatherData>(`/weather/refresh?lat=${lat}&lon=${lon}`);
}

export function fetchNews(): Promise<ApiResult<NewsData>> {
  return get<NewsData>('/news');
}

export function refreshNews(): Promise<ApiResult<NewsData>> {
  return post<NewsData>('/news/refresh');
}

export function fetchAgenda(): Promise<ApiResult<AgendaData>> {
  return get<AgendaData>('/agenda');
}

export function refreshAgenda(): Promise<ApiResult<AgendaData>> {
  return post<AgendaData>('/agenda/refresh');
}

export function fetchGames(): Promise<ApiResult<FreeGamesData>> {
  return get<FreeGamesData>('/games');
}

export function refreshGames(): Promise<ApiResult<FreeGamesData>> {
  return post<FreeGamesData>('/games/refresh');
}
