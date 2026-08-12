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
} from './api-types';
export { isUpcomingEpisode, isSeasonPremiere } from './api-types';
export { queryKeys } from './query-keys';
export { getWeatherCondition, type WeatherCondition } from './weather-codes';
export type { WidgetManifest, WidgetZone } from './widget-manifest';
