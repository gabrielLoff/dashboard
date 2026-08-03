import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFetchWeather, mockFetchWeatherByCoords, mockFetchNews, mockFetchAgenda, mockFetchGames, mockFetchUpcoming } = vi.hoisted(() => ({
  mockFetchWeather: vi.fn(),
  mockFetchWeatherByCoords: vi.fn(),
  mockFetchNews: vi.fn(),
  mockFetchAgenda: vi.fn(),
  mockFetchGames: vi.fn(),
  mockFetchUpcoming: vi.fn(),
}));

vi.mock('@tanstack/svelte-query', () => ({
  createQuery: vi.fn(),
}));

vi.mock('../src/lib/widget-registry.ts', () => ({
  sourceConfigs: {
    weather: {
      key: (args?: { lat?: number; lon?: number }) =>
        args?.lat != null && args?.lon != null
          ? ['dashboard', 'weather', args.lat.toFixed(2), args.lon.toFixed(2)]
          : ['dashboard', 'weather'],
      fn: (args?: { lat?: number; lon?: number; location?: string }) =>
        args?.lat != null && args?.lon != null
          ? mockFetchWeatherByCoords(args.lat, args.lon)
          : mockFetchWeather(args?.location),
      staleTime: 5 * 60 * 1000,
      refetchInterval: 10 * 60 * 1000,
    },
    news: {
      key: (filters?: { country?: string; category?: string }) =>
        ['dashboard', 'news', filters?.country ?? 'all', filters?.category ?? 'general'],
      fn: (filters?: { country?: string; category?: string }) => mockFetchNews(filters),
      staleTime: 15 * 60 * 1000,
      refetchInterval: 30 * 60 * 1000,
    },
    agenda: {
      key: () => ['dashboard', 'agenda'],
      fn: () => mockFetchAgenda(),
      staleTime: 5 * 60 * 1000,
      refetchInterval: 10 * 60 * 1000,
    },
    games: {
      key: (filters?: { type?: string; platform?: string; page?: number }) =>
        ['dashboard', 'games', filters?.type ?? 'all', filters?.platform ?? 'pc', filters?.page ?? 1],
      fn: (filters?: { type?: string; platform?: string; page?: number }) => mockFetchGames(filters),
      staleTime: 6 * 60 * 60 * 1000,
      refetchInterval: 12 * 60 * 60 * 1000,
    },
    shows: {
      key: (ids?: number[]) => ['dashboard', 'shows', 'upcoming', ...(ids ?? []).sort((a: number, b: number) => a - b)],
      fn: (ids?: number[]) => mockFetchUpcoming(ids ?? []),
      staleTime: 5 * 60 * 1000,
      refetchInterval: 10 * 60 * 1000,
    },
  },
}));

vi.mock('../src/lib/api-client.ts', () => ({
  fetchWeather: mockFetchWeather,
  fetchWeatherByCoords: mockFetchWeatherByCoords,
  fetchNews: mockFetchNews,
  fetchAgenda: mockFetchAgenda,
  fetchGames: mockFetchGames,
  fetchUpcoming: mockFetchUpcoming,
}));

import { createQuery } from '@tanstack/svelte-query';
import { useSourceQuery } from '../src/lib/query-config.ts';

const mockCreateQuery = vi.mocked(createQuery);

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateQuery.mockReturnValue({
    subscribe: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
  } as never);
});

describe('useSourceQuery', () => {
  it('calls createQuery with correct options for weather', () => {
    useSourceQuery('weather');

    expect(mockCreateQuery).toHaveBeenCalledOnce();
    expect(mockCreateQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['dashboard', 'weather'],
        staleTime: 5 * 60 * 1000,
        refetchInterval: 10 * 60 * 1000,
      }),
    );
  });

  it('calls createQuery with correct options for news', () => {
    useSourceQuery('news');

    expect(mockCreateQuery).toHaveBeenCalledOnce();
    expect(mockCreateQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['dashboard', 'news', 'all', 'general'],
        staleTime: 15 * 60 * 1000,
        refetchInterval: 30 * 60 * 1000,
      }),
    );
  });

  it('calls createQuery with correct options for agenda', () => {
    useSourceQuery('agenda');

    expect(mockCreateQuery).toHaveBeenCalledOnce();
    expect(mockCreateQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['dashboard', 'agenda'],
        staleTime: 5 * 60 * 1000,
        refetchInterval: 10 * 60 * 1000,
      }),
    );
  });

  it('calls createQuery with correct options for games', () => {
    useSourceQuery('games');

    expect(mockCreateQuery).toHaveBeenCalledOnce();
    expect(mockCreateQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['dashboard', 'games', 'all', 'pc', 1],
        staleTime: 6 * 60 * 60 * 1000,
        refetchInterval: 12 * 60 * 60 * 1000,
      }),
    );
  });

  it('throws for unknown source', () => {
    expect(() => useSourceQuery('unknown' as never)).toThrow('Unknown source: unknown');
  });

  it('uses byCoords query key when weather receives coords', () => {
    useSourceQuery('weather', { lat: -30.03, lon: -51.21 });

    expect(mockCreateQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['dashboard', 'weather', '-30.03', '-51.21'],
      }),
    );
  });

  it('uses current query key when weather receives location', () => {
    useSourceQuery('weather', { location: 'São Paulo' });

    expect(mockCreateQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['dashboard', 'weather'],
      }),
    );
  });

  it('calls createQuery with correct options for news with filters', () => {
    useSourceQuery('news', { country: 'us', category: 'technology' });

    expect(mockCreateQuery).toHaveBeenCalledOnce();
    expect(mockCreateQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['dashboard', 'news', 'us', 'technology'],
        staleTime: 15 * 60 * 1000,
        refetchInterval: 30 * 60 * 1000,
      }),
    );
  });
});
