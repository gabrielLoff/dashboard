export { type ApiResult, ok, err, isOk, isErr } from './result';
export type {
  WeatherData,
  ForecastDay,
  NewsData,
  NewsItem,
  NewsFilters,
  AgendaData,
  AgendaEvent,
  FreeGamesData,
  FreeGame,
  GameType,
  GamePlatform,
  GamesFilters,
  ShowSearchResult,
  UpcomingEpisode,
  SeasonPremiere,
  UpcomingEntry,
  ShowsData,
  EpisodeProgress,
  EpisodeListEntry,
} from './api-types';
export { isUpcomingEpisode, isSeasonPremiere } from './api-types';
export {
  ENDPOINT_META,
  request,
  type Endpoints,
  type EndpointKey,
  type EndpointInput,
  type EndpointResponse,
  type WeatherArgs,
} from './endpoints';
export { getWeatherCondition, type WeatherCondition } from './weather-codes';
export type { Connector } from './connector';
export type {
  WidgetManifest,
  WidgetZone,
  QueryWidget,
  LocalWidget,
} from './widget-manifest';
export { isQueryWidget } from './widget-manifest';
export type {
  Habit,
  WatchlistEntry,
  SyncData,
} from './api-types';
