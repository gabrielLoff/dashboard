import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createWeatherRoute } from './routes/weather.ts';
import { createNewsRoute } from './routes/news.ts';
import { createAgendaRoute } from './routes/agenda.ts';
import { createGamesRoute } from './routes/games.ts';
import { createShowsRoute } from './routes/shows.ts';
import { createSyncRoute } from './routes/sync.ts';
import type {
  ApiResult,
  WeatherData,
  NewsData,
  NewsFilters,
  AgendaData,
  FreeGamesData,
  GamesFilters,
  ShowSearchResult,
  ShowsData,
  EpisodeListEntry,
} from '@dashboard/shared';

export interface AppDeps {
  fetchWeather: (loc: string) => Promise<ApiResult<WeatherData>>;
  fetchWeatherByCoords: (lat: number, lon: number) => Promise<ApiResult<WeatherData>>;
  fetchNews: (filters: NewsFilters) => Promise<ApiResult<NewsData>>;
  fetchAgenda: () => Promise<ApiResult<AgendaData>>;
  fetchGames: (filters: GamesFilters) => Promise<ApiResult<FreeGamesData>>;
  searchShows: (query: string) => Promise<ApiResult<ShowSearchResult[]>>;
  getUpcomingEpisodes: (ids: number[]) => Promise<ApiResult<ShowsData>>;
  fetchEpisodes: (showId: number) => Promise<ApiResult<EpisodeListEntry[]>>;
}

export type CalendarStatus = 'connected' | 'missing-refresh-token';

/**
 * Builds the BFF's Hono app. Pure: no side effects, no listening socket.
 * `index.ts` supplies live-or-mock connectors; the contract test supplies stubs.
 */
export function createApp(deps: AppDeps): Hono {
  const app = new Hono();

  app.use('*', cors({ origin: 'http://localhost:5173' }));

  app.get('/api/health', (c) =>
    c.json({
      status: 'ok',
      mock: process.env.MOCK !== 'false',
    }),
  );

  app.route('/api/weather', createWeatherRoute(deps.fetchWeather, deps.fetchWeatherByCoords));
  app.route('/api/news', createNewsRoute(deps.fetchNews));
  app.route('/api/agenda', createAgendaRoute(deps.fetchAgenda));
  app.route('/api/games', createGamesRoute(deps.fetchGames));
  app.route(
    '/api/shows',
    createShowsRoute(deps.searchShows, deps.getUpcomingEpisodes, deps.fetchEpisodes),
  );
  app.route('/api/sync', createSyncRoute());

  return app;
}
