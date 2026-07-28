import { ok, type ApiResult } from '@dashboard/shared';
import type {
  WeatherData,
  NewsData,
  AgendaData,
  FreeGamesData,
} from '@dashboard/shared';

const MOCK = process.env.MOCK !== 'false';

const today = new Date();
const mockWeather: WeatherData = {
  location: 'Porto Alegre',
  temperature: 22,
  feelsLike: 20,
  humidity: 65,
  condition: 'Partly Cloudy',
  icon: 'cloud-sun',
  windSpeed: 12,
  forecast: [
    { date: today.toISOString().split('T')[0], high: 24, low: 16, condition: 'Partly Cloudy', icon: 'cloud-sun' },
    { date: new Date(today.getTime() + 86400000).toISOString().split('T')[0], high: 26, low: 17, condition: 'Sunny', icon: 'sun' },
    { date: new Date(today.getTime() + 172800000).toISOString().split('T')[0], high: 23, low: 15, condition: 'Rainy', icon: 'cloud-rain' },
    { date: new Date(today.getTime() + 259200000).toISOString().split('T')[0], high: 21, low: 14, condition: 'Cloudy', icon: 'cloud' },
    { date: new Date(today.getTime() + 345600000).toISOString().split('T')[0], high: 25, low: 16, condition: 'Sunny', icon: 'sun' },
  ],
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
      imageUrl: 'https://placehold.co/200x120/6366f1/ffffff?text=Node.js',
    },
    {
      id: '2',
      title: 'Svelte 5 Runes: A Year in Review',
      source: 'Frontend Focus',
      url: 'https://example.com/svelte-5',
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      summary:
        'One year after the stable release, the community weighs in on how runes changed the Svelte development experience.',
      imageUrl: 'https://placehold.co/200x120/8b5cf6/ffffff?text=Svelte',
    },
    {
      id: '3',
      title: 'Tauri v2 Adoption Doubles Among Desktop Apps',
      source: 'Dev News',
      url: 'https://example.com/tauri-v2',
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      summary:
        'Tauri v2 has doubled its adoption rate in 2026, overtaking Electron in new desktop app starts for the first time.',
      imageUrl: 'https://placehold.co/200x120/ec4899/ffffff?text=Tauri',
    },
  ],
  updatedAt: new Date().toISOString(),
};

const today = new Date();
const tomorrow = new Date(today.getTime() + 86400000);
const dayAfterTomorrow = new Date(today.getTime() + 172800000);
const fmt = (d: Date) => d.toISOString().split('T')[0];

const mockAgenda: AgendaData = {
  events: [
    {
      id: '1',
      title: 'Team Standup',
      date: fmt(today),
      time: '09:00',
      location: 'Google Meet',
      description: 'Daily sync with the engineering team.',
      status: 'confirmed',
    },
    {
      id: '2',
      title: 'Design Brainstorm',
      date: fmt(today),
      time: '14:00',
      location: 'Conference Room A',
      description: 'Brainstorming session for the new landing page redesign.',
      status: 'tentative',
    },
    {
      id: '3',
      title: 'Dentist Appointment',
      date: fmt(tomorrow),
      time: '10:30',
      location: 'Dr. Silva - Rua dos Andradas, 1542',
      description: 'Six-month checkup.',
      status: 'confirmed',
    },
    {
      id: '4',
      title: 'Client Workshop',
      date: fmt(tomorrow),
      time: '15:00',
      location: 'Zoom',
      description: 'Quarterly workshop with the client to align on roadmap priorities.',
      status: 'cancelled',
    },
    {
      id: '5',
      title: 'Sprint Retrospective',
      date: fmt(dayAfterTomorrow),
      time: '16:00',
      location: 'Google Meet',
      description: 'End-of-sprint retro to discuss what went well and what to improve.',
      status: 'confirmed',
    },
  ],
  updatedAt: new Date().toISOString(),
};

const mockGames: FreeGamesData = {
  games: [
    {
      id: '1',
      title: 'Celeste',
      platform: 'PC, Steam',
      source: 'Game',
      url: 'https://www.gamerpower.com/open/celeste',
      expiryDate: new Date(Date.now() + 604800000).toISOString().split('T')[0],
      imageUrl: 'https://placehold.co/200x120/6366f1/ffffff?text=Celeste',
    },
    {
      id: '2',
      title: 'Into the Breach',
      platform: 'PC, Steam, DRM-Free',
      source: 'Game',
      url: 'https://www.gamerpower.com/open/into-the-breach',
      expiryDate: new Date(Date.now() + 604800000).toISOString().split('T')[0],
      imageUrl: 'https://placehold.co/200x120/8b5cf6/ffffff?text=ITB',
    },
    {
      id: '3',
      title: 'Hollow Knight',
      platform: 'PC, DRM-Free',
      source: 'Game',
      url: 'https://www.gamerpower.com/open/hollow-knight',
      expiryDate: new Date(Date.now() + 2592000000).toISOString().split('T')[0],
      imageUrl: 'https://placehold.co/200x120/ec4899/ffffff?text=HK',
    },
    {
      id: '4',
      title: 'Free Game Launcher Pack',
      platform: 'PC',
      source: 'Loot',
      url: 'https://www.gamerpower.com/open/launcher-pack',
      expiryDate: '',
      imageUrl: 'https://placehold.co/200x120/f59e0b/ffffff?text=Loot',
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
