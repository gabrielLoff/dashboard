export interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  condition: string;
  icon: string;
  windSpeed: number;
  updatedAt: string;
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

export interface DashboardData {
  weather: WeatherData;
  news: NewsData;
  agenda: AgendaData;
  games: FreeGamesData;
}
