import { ok, type ApiResult } from '@dashboard/shared';
import type {
  WeatherData,
  NewsData,
  AgendaData,
  FreeGamesData,
  ShowSearchResult,
  ShowsData,
} from '@dashboard/shared';

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

const mockShowSearch: ShowSearchResult[] = [
  {
    id: 169,
    name: 'Breaking Bad',
    status: 'Ended',
    premiered: '2008-01-20',
    ended: '2013-09-29',
    image: { medium: 'https://static.tvmaze.com/uploads/images/medium_portrait/0/240.jpg', original: 'https://static.tvmaze.com/uploads/images/original_untouched/0/240.jpg' },
    network: { name: 'AMC' },
    summary: 'A high school chemistry teacher turned meth producer.',
  },
  {
    id: 46562,
    name: 'The Last of Us',
    status: 'Running',
    premiered: '2023-01-15',
    image: { medium: 'https://static.tvmaze.com/uploads/images/medium_portrait/465/1163815.jpg', original: 'https://static.tvmaze.com/uploads/images/original_untouched/465/1163815.jpg' },
    network: { name: 'HBO' },
    summary: 'Joel and Ellie navigate a post-apocalyptic America.',
  },
  {
    id: 690,
    name: 'Stranger Things',
    status: 'Running',
    premiered: '2016-07-15',
    image: { medium: 'https://static.tvmaze.com/uploads/images/medium_portrait/690/1740795.jpg', original: 'https://static.tvmaze.com/uploads/images/original_untouched/690/1740795.jpg' },
    network: null,
    webChannel: { name: 'Netflix' },
    summary: 'Kids in small town face supernatural forces.',
  },
  {
    id: 175,
    name: 'The Office',
    status: 'Ended',
    premiered: '2005-03-24',
    ended: '2013-05-16',
    image: { medium: 'https://static.tvmaze.com/uploads/images/medium_portrait/175/435447.jpg', original: 'https://static.tvmaze.com/uploads/images/original_untouched/175/435447.jpg' },
    network: { name: 'NBC' },
    summary: 'Mockumentary about office workers at Dunder Mifflin.',
  },
];

const futureDate1 = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
const futureDate2 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

const mockShowsUpcoming: ShowsData = {
  upcoming: [
    {
      showId: 46562,
      showName: 'The Last of Us',
      season: 3,
      number: 1,
      title: 'TBA',
      airdate: futureDate1,
      airtime: '21:00',
      runtime: 60,
      image: 'https://static.tvmaze.com/uploads/images/medium_portrait/465/1163815.jpg',
    },
    {
      showId: 690,
      showName: 'Stranger Things',
      season: 5,
      premiereDate: futureDate2,
      image: 'https://static.tvmaze.com/uploads/images/medium_portrait/690/1740795.jpg',
    },
  ],
  updatedAt: new Date().toISOString(),
};

export function getMockShows(): ApiResult<ShowSearchResult[]> {
  return ok(mockShowSearch);
}

export function getMockShowsUpcoming(): ApiResult<ShowsData> {
  return ok({ ...mockShowsUpcoming, updatedAt: new Date().toISOString() });
}
