import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tanstack/svelte-query', () => ({
  createQuery: vi.fn(),
}));

vi.mock('../src/lib/api-client.ts', () => ({
  fetchWeather: vi.fn(),
  fetchWeatherByCoords: vi.fn(),
  fetchNews: vi.fn(),
  fetchAgenda: vi.fn(),
  fetchGames: vi.fn(),
  fetchUpcoming: vi.fn(),
  refreshWeather: vi.fn(),
  refreshWeatherByCoords: vi.fn(),
  refreshNews: vi.fn(),
  refreshAgenda: vi.fn(),
  refreshGames: vi.fn(),
  refreshUpcoming: vi.fn(),
}));

vi.mock('../src/lib/query-client.ts', () => ({
  queryClient: { setQueryData: vi.fn(), invalidateQueries: vi.fn() },
}));

vi.mock('svelte-french-toast', () => ({
  default: { success: vi.fn() },
}));

import { createQuery } from '@tanstack/svelte-query';
import { createWidgetQuery, createWidgetRefresh } from '../src/lib/widget-query';
import { manifest as weatherManifest } from '../src/widgets/weather/manifest';
import { manifest as newsManifest } from '../src/widgets/news/manifest';
import { manifest as agendaManifest } from '../src/widgets/agenda/manifest';
import { manifest as gamesManifest } from '../src/widgets/games/manifest';
import { manifest as showsManifest } from '../src/widgets/shows/manifest';

const mockCreateQuery = vi.mocked(createQuery);

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateQuery.mockReturnValue({
    subscribe: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
  } as never);
});

describe('createWidgetQuery', () => {
  it('calls createQuery with correct options for weather (no args)', () => {
    createWidgetQuery(weatherManifest);

    expect(mockCreateQuery).toHaveBeenCalledOnce();
    expect(mockCreateQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['dashboard', 'weather'],
        staleTime: 5 * 60 * 1000,
        refetchInterval: 10 * 60 * 1000,
      }),
    );
  });

  it('calls createQuery with correct options for weather with coords', () => {
    createWidgetQuery(weatherManifest, { lat: -30.03, lon: -51.21 });

    expect(mockCreateQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['dashboard', 'weather', '-30.03', '-51.21'],
      }),
    );
  });

  it('calls createQuery with correct options for news', () => {
    createWidgetQuery(newsManifest);

    expect(mockCreateQuery).toHaveBeenCalledOnce();
    expect(mockCreateQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['dashboard', 'news', 'all', 'general'],
        staleTime: 15 * 60 * 1000,
        refetchInterval: 30 * 60 * 1000,
      }),
    );
  });

  it('calls createQuery with correct options for news with filters', () => {
    createWidgetQuery(newsManifest, { country: 'us', category: 'technology' });

    expect(mockCreateQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['dashboard', 'news', 'us', 'technology'],
      }),
    );
  });

  it('calls createQuery with correct options for agenda', () => {
    createWidgetQuery(agendaManifest);

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
    createWidgetQuery(gamesManifest);

    expect(mockCreateQuery).toHaveBeenCalledOnce();
    expect(mockCreateQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['dashboard', 'games', 'all', 'pc', 1],
        staleTime: 6 * 60 * 60 * 1000,
        refetchInterval: 12 * 60 * 60 * 1000,
      }),
    );
  });

  it('calls createQuery with correct options for shows', () => {
    createWidgetQuery(showsManifest, [1, 2, 3]);

    expect(mockCreateQuery).toHaveBeenCalledOnce();
    expect(mockCreateQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['dashboard', 'shows', 'upcoming', 1, 2, 3],
        staleTime: 5 * 60 * 1000,
        refetchInterval: 10 * 60 * 1000,
      }),
    );
  });

  it('throws for manifest without query config', () => {
    const habitsManifest = { id: 'habits', component: () => {}, defaultLayout: { col: 0, row: 0, colSpan: 1, rowSpan: 1 } };
    expect(() => createWidgetQuery(habitsManifest)).toThrow('Manifest "habits" does not declare query config');
  });
});

describe('createWidgetRefresh', () => {
  it('creates a refresh handler', () => {
    const refetchFn = vi.fn().mockResolvedValue(undefined);
    const handler = createWidgetRefresh(agendaManifest, refetchFn);

    expect(typeof handler).toBe('function');
  });

  it('throws for manifest without refresh config', () => {
    const habitsManifest = { id: 'habits', component: () => {}, defaultLayout: { col: 0, row: 0, colSpan: 1, rowSpan: 1 } };
    expect(() => createWidgetRefresh(habitsManifest, vi.fn())).toThrow('Manifest "habits" does not declare refresh config');
  });
});
