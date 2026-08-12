import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { createWeatherRoute } from './routes/weather.ts';
import { createNewsRoute } from './routes/news.ts';
import { createAgendaRoute } from './routes/agenda.ts';
import { createGamesRoute } from './routes/games.ts';
import { createShowsRoute } from './routes/shows.ts';
import { createSyncRoute } from './routes/sync.ts';
import { fetchWeather, fetchWeatherByCoords } from './connectors/weather.ts';
import { fetchNews, type NewsFilters } from './connectors/news.ts';
import { fetchAgenda } from './connectors/agenda.ts';
import { fetchGames } from './connectors/games.ts';
import type { GamesFilters } from '@dashboard/shared';
import { searchShows, getUpcomingEpisodes, fetchEpisodes } from './connectors/shows.ts';
import { getMockWeather, getMockNews, getMockAgenda, getMockGames, getMockShows, getMockShowsUpcoming } from './mock-data.ts';
import { getAccessToken } from './lib/google-auth.ts';
import type { ApiResult, WeatherData, NewsData, AgendaData, FreeGamesData, ShowSearchResult, ShowsData, EpisodeListEntry } from '@dashboard/shared';

type CalendarStatus = 'connected' | 'missing-refresh-token';

let calendarStatus: CalendarStatus = 'missing-refresh-token';

const app = new Hono();

app.use('*', cors({ origin: 'http://localhost:5173' }));

app.get('/api/health', (c) =>
  c.json({
    status: 'ok',
    mock: process.env.MOCK !== 'false',
    calendar: calendarStatus,
  }),
);

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
  ? ((q: string) => Promise.resolve(getMockShows())) as (query: string) => Promise<ApiResult<ShowSearchResult[]>>
  : searchShows;
const getUpcomingEpisodes_ = mockMode
  ? ((ids: number[]) => Promise.resolve(getMockShowsUpcoming())) as (ids: number[]) => Promise<ApiResult<ShowsData>>
  : getUpcomingEpisodes;
const fetchEpisodes_ = mockMode
  ? ((_id: number) => Promise.resolve({ ok: true, data: [] } as ApiResult<EpisodeListEntry[]>))
  : fetchEpisodes;

const weatherRoute = createWeatherRoute(fetchWeather_, fetchWeatherByCoords_);
const newsRoute = createNewsRoute(fetchNews_);
const agendaRoute = createAgendaRoute(fetchAgenda_);
const gamesRoute = createGamesRoute(fetchGames_);
const showsRoute = createShowsRoute(searchShows_, getUpcomingEpisodes_, fetchEpisodes_);
const syncRoute = createSyncRoute();

app.route('/api/weather', weatherRoute);
app.route('/api/news', newsRoute);
app.route('/api/agenda', agendaRoute);
app.route('/api/games', gamesRoute);
app.route('/api/shows', showsRoute);
app.route('/api/sync', syncRoute);

const port = Number(process.env.PORT) || 3001;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(
    `BFF server running on http://localhost:${info.port} (MOCK=${process.env.MOCK !== 'false'})`,
  );
});

getAccessToken()
  .then(() => {
    calendarStatus = 'connected';
    console.log('Google Calendar: connected');
  })
  .catch((e: unknown) => {
    calendarStatus = 'missing-refresh-token';
    console.log(
      `Google Calendar: refresh token invalid — widget will show errors (${String(e)})`,
    );
  });