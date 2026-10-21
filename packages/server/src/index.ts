import 'dotenv/config';
import { serve } from '@hono/node-server';
import { createApp } from './app.ts';
import { fetchWeather, fetchWeatherByCoords } from './connectors/weather.ts';
import { fetchNews, type NewsFilters } from './connectors/news.ts';
import { fetchAgenda } from './connectors/agenda.ts';
import { fetchGames } from './connectors/games.ts';
import type { GamesFilters } from '@dashboard/shared';
import { searchShows, getUpcomingEpisodes, fetchEpisodes } from './connectors/shows.ts';
import { getMockWeather, getMockNews, getMockAgenda, getMockGames, getMockShows, getMockShowsUpcoming } from './mock-data.ts';
import { getAccessToken } from './lib/google-auth.ts';
import type { ApiResult, WeatherData, NewsData, AgendaData, FreeGamesData, ShowSearchResult, ShowsData, EpisodeListEntry } from '@dashboard/shared';

const mockMode = process.env.MOCK !== 'false';

const fetchWeather_ = mockMode
  ? (() => Promise.resolve(getMockWeather())) as (loc: string) => Promise<ApiResult<WeatherData>>
  : fetchWeather;
const fetchWeatherByCoords_ = mockMode
  ? (() => Promise.resolve(getMockWeather())) as (lat: number, lon: number) => Promise<ApiResult<WeatherData>>
  : fetchWeatherByCoords;
const fetchNews_ = mockMode
  ? (() => Promise.resolve(getMockNews())) as (filters?: NewsFilters) => Promise<ApiResult<NewsData>>
  : fetchNews;
const fetchAgenda_ = mockMode
  ? (() => Promise.resolve(getMockAgenda())) as () => Promise<ApiResult<AgendaData>>
  : fetchAgenda;
const fetchGames_ = mockMode
  ? (() => Promise.resolve(getMockGames())) as (filters: GamesFilters) => Promise<ApiResult<FreeGamesData>>
  : fetchGames;
const searchShows_ = mockMode
  ? ((_q: string) => Promise.resolve(getMockShows())) as (query: string) => Promise<ApiResult<ShowSearchResult[]>>
  : searchShows;
const getUpcomingEpisodes_ = mockMode
  ? ((_ids: number[]) => Promise.resolve(getMockShowsUpcoming())) as (ids: number[]) => Promise<ApiResult<ShowsData>>
  : getUpcomingEpisodes;
const fetchEpisodes_ = mockMode
  ? ((_id: number) => Promise.resolve({ ok: true, data: [] } as ApiResult<EpisodeListEntry[]>))
  : fetchEpisodes;

const app = createApp({
  fetchWeather: fetchWeather_,
  fetchWeatherByCoords: fetchWeatherByCoords_,
  fetchNews: fetchNews_,
  fetchAgenda: fetchAgenda_,
  fetchGames: fetchGames_,
  searchShows: searchShows_,
  getUpcomingEpisodes: getUpcomingEpisodes_,
  fetchEpisodes: fetchEpisodes_,
});

const port = Number(process.env.PORT) || 3001;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(
    `BFF server running on http://localhost:${info.port} (MOCK=${process.env.MOCK !== 'false'})`,
  );
});

getAccessToken()
  .then(() => {
    console.log('Google Calendar: connected');
  })
  .catch((e: unknown) => {
    console.log(
      `Google Calendar: refresh token invalid — widget will show errors (${String(e)})`,
    );
  });
