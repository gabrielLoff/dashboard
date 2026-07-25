import { ok, err, type ApiResult } from '@dashboard/shared';
import type {
  WeatherData,
  NewsData,
  AgendaData,
  FreeGamesData,
} from '@dashboard/shared';

const MOCK = process.env.MOCK !== 'false';

const mockWeather: WeatherData = {
  location: 'Porto Alegre',
  temperature: 22,
  feelsLike: 20,
  humidity: 65,
  condition: 'Partly Cloudy',
  icon: 'cloud-sun',
  windSpeed: 12,
  updatedAt: new Date().toISOString(),
};

const mockNews: NewsData = {
  items: [
    {
      id: '1',
      title: 'New JavaScript Runtime Lands in Node.js 24',
      source: 'JavaScript Weekly',
      url: 'https://example.com/js-runtime',
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      summary:
        'Node.js 24 introduces a novel runtime architecture that promises 40% faster startup times for serverless environments.',
    },
    {
      id: '2',
      title: 'Svelte 5 Runes: A Year in Review',
      source: 'Frontend Focus',
      url: 'https://example.com/svelte-5',
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      summary:
        'One year after the stable release, the community weighs in on how runes changed the Svelte development experience.',
    },
    {
      id: '3',
      title: 'Tauri v2 Adoption Doubles Among Desktop Apps',
      source: 'Dev News',
      url: 'https://example.com/tauri-v2',
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      summary:
        'Tauri v2 has doubled its adoption rate in 2026, overtaking Electron in new desktop app starts for the first time.',
    },
  ],
  updatedAt: new Date().toISOString(),
};

const mockAgenda: AgendaData = {
  events: [
    {
      id: '1',
      title: 'Team Standup',
      date: new Date().toISOString().split('T')[0]!,
      time: '09:00',
      location: 'Google Meet',
      description: 'Daily sync with the engineering team.',
    },
    {
      id: '2',
      title: 'Dentist Appointment',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0]!,
      time: '14:30',
      location: 'Dr. Silva - Rua dos Andradas, 1542',
      description: 'Six-month checkup.',
    },
    {
      id: '3',
      title: 'Project Review',
      date: new Date(Date.now() + 172800000).toISOString().split('T')[0]!,
      time: '11:00',
      location: 'Conference Room B',
      description: 'Quarterly review of the dashboard project.',
    },
  ],
  updatedAt: new Date().toISOString(),
};

const mockGames: FreeGamesData = {
  games: [
    {
      id: '1',
      title: 'Celeste',
      platform: 'PC',
      source: 'Epic Games',
      url: 'https://store.epicgames.com/p/celeste',
      expiryDate: new Date(Date.now() + 604800000).toISOString().split('T')[0]!,
      imageUrl: 'https://placehold.co/200x120/6366f1/ffffff?text=Celeste',
    },
    {
      id: '2',
      title: 'Into the Breach',
      platform: 'PC',
      source: 'Epic Games',
      url: 'https://store.epicgames.com/p/into-the-breach',
      expiryDate: new Date(Date.now() + 604800000).toISOString().split('T')[0]!,
      imageUrl: 'https://placehold.co/200x120/8b5cf6/ffffff?text=ITB',
    },
    {
      id: '3',
      title: 'Hollow Knight',
      platform: 'PC',
      source: 'Prime Gaming',
      url: 'https://gaming.amazon.com/hollow-knight',
      expiryDate: new Date(Date.now() + 2592000000).toISOString().split('T')[0]!,
      imageUrl: 'https://placehold.co/200x120/ec4899/ffffff?text=HK',
    },
  ],
  updatedAt: new Date().toISOString(),
};

export function getMockWeather(): ApiResult<WeatherData> {
  return ok({ ...mockWeather, updatedAt: new Date().toISOString() });
}

export function getMockNews(): ApiResult<NewsData> {
  return ok({ ...mockNews, updatedAt: new Date().toISOString() });
}

export function getMockAgenda(): ApiResult<AgendaData> {
  return ok({ ...mockAgenda, updatedAt: new Date().toISOString() });
}

export function getMockGames(): ApiResult<FreeGamesData> {
  return ok({ ...mockGames, updatedAt: new Date().toISOString() });
}

export function isMockMode(): boolean {
  return MOCK;
}
