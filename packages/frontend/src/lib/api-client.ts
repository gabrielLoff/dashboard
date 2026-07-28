import type { ApiResult, WeatherData, NewsData, NewsFilters, AgendaData, FreeGamesData, ShowSearchResult, ShowsData } from '@dashboard/shared';

export type { NewsFilters };

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

export function newsQueryParams(filters?: NewsFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.country) params.set('country', filters.country);
  if (filters.category) params.set('category', filters.category);
  const str = params.toString();
  return str ? `?${str}` : '';
}

export function fetchNews(filters?: NewsFilters): Promise<ApiResult<NewsData>> {
  return get<NewsData>(`/news${newsQueryParams(filters)}`);
}

export function refreshNews(filters?: NewsFilters): Promise<ApiResult<NewsData>> {
  return post<NewsData>(`/news/refresh${newsQueryParams(filters)}`);
}

export function fetchAgenda(): Promise<ApiResult<AgendaData>> {
  return get<AgendaData>('/agenda');
}

export function refreshAgenda(): Promise<ApiResult<AgendaData>> {
  return post<AgendaData>('/agenda/refresh');
}

export interface GamesFilters {
  type?: string;
  platform?: string;
  page?: number;
}

function gamesQueryParams(filters?: GamesFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.platform) params.set('platform', filters.platform);
  if (filters.page) params.set('page', String(filters.page));
  const str = params.toString();
  return str ? `?${str}` : '';
}

export function fetchGames(filters?: GamesFilters): Promise<ApiResult<FreeGamesData>> {
  return get<FreeGamesData>(`/games${gamesQueryParams(filters)}`);
}

export function refreshGames(filters?: GamesFilters): Promise<ApiResult<FreeGamesData>> {
  return post<FreeGamesData>(`/games/refresh${gamesQueryParams(filters)}`);
}

export function searchShows(query: string): Promise<ApiResult<ShowSearchResult[]>> {
  return get<ShowSearchResult[]>(`/shows/search?q=${encodeURIComponent(query)}`);
}

export function fetchUpcoming(ids: number[]): Promise<ApiResult<ShowsData>> {
  if (ids.length === 0) {
    return Promise.resolve({ ok: true, data: { upcoming: [], updatedAt: new Date().toISOString() } });
  }
  const param = ids.join(',');
  return get<ShowsData>(`/shows/upcoming?ids=${param}`);
}

export function refreshUpcoming(ids: number[]): Promise<ApiResult<ShowsData>> {
  const param = ids.join(',');
  return post<ShowsData>(`/shows/upcoming/refresh?ids=${param}`);
}
