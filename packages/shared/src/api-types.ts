export interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  condition: string;
  icon: string;
  windSpeed: number;
  forecast: ForecastDay[];
  updatedAt: string;
}

export interface ForecastDay {
  date: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  summary: string;
  imageUrl?: string;
}

export interface NewsData {
  items: NewsItem[];
  updatedAt: string;
}

export interface AgendaEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
}

export interface AgendaData {
  events: AgendaEvent[];
  updatedAt: string;
}

export interface FreeGame {
  id: string;
  title: string;
  platform: string;
  source: string;
  url: string;
  expiryDate: string;
  imageUrl: string;
}

export interface FreeGamesData {
  games: FreeGame[];
  totalResults: number;
  page: number;
  pageSize: number;
  updatedAt: string;
}

export interface NewsFilters {
  country?: string;
  category?: string;
}

export interface ShowSearchResult {
  id: number;
  name: string;
  status: string;
  premiered?: string;
  ended?: string;
  image?: { medium: string; original: string };
  network?: { name: string } | null;
  webChannel?: { name: string } | null;
  summary?: string;
}

export interface UpcomingEpisode {
  showId: number;
  showName: string;
  season: number;
  number: number;
  title: string;
  airdate: string;
  airtime: string;
  runtime: number;
  image?: string;
}

export interface SeasonPremiere {
  showId: number;
  showName: string;
  season: number;
  premiereDate: string | null;
  image?: string;
}

export type UpcomingEntry = UpcomingEpisode | SeasonPremiere;

export function isUpcomingEpisode(entry: UpcomingEntry): entry is UpcomingEpisode {
  return 'number' in entry;
}

export function isSeasonPremiere(entry: UpcomingEntry): entry is SeasonPremiere {
  return !('number' in entry);
}

export interface ShowsData {
  upcoming: UpcomingEntry[];
  updatedAt: string;
}
