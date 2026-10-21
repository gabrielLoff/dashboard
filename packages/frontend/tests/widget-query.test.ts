import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tanstack/svelte-query', () => ({
  createQuery: vi.fn(),
}));

vi.mock('../src/lib/query-client.ts', () => ({
  queryClient: { setQueryData: vi.fn(), invalidateQueries: vi.fn() },
}));

vi.mock('svelte-french-toast', () => ({
  default: { success: vi.fn() },
}));

import { createQuery } from '@tanstack/svelte-query';
import { queryClient } from '../src/lib/query-client';
import toast from 'svelte-french-toast';
import { createWidgetQuery, createWidgetRefresh } from '../src/lib/widget-query';
import { manifest as weatherManifest } from '../src/widgets/weather/manifest';
import { manifest as newsManifest } from '../src/widgets/news/manifest';
import { manifest as agendaManifest } from '../src/widgets/agenda/manifest';
import { manifest as gamesManifest } from '../src/widgets/games/manifest';
import { manifest as showsManifest } from '../src/widgets/shows/manifest';
import { manifest as watchingManifest } from '../src/widgets/watching/manifest';

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
    createWidgetQuery(gamesManifest, { platform: 'pc', page: 1 });

    expect(mockCreateQuery).toHaveBeenCalledOnce();
    expect(mockCreateQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['dashboard', 'games', 'pc', 'all', 1],
        staleTime: 6 * 60 * 60 * 1000,
        refetchInterval: 12 * 60 * 60 * 1000,
      }),
    );
  });

  it('calls createQuery with correct options for shows', () => {
    createWidgetQuery(showsManifest, { ids: [3, 1, 2] });

    expect(mockCreateQuery).toHaveBeenCalledOnce();
    expect(mockCreateQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['dashboard', 'shows', 'upcoming', 1, 2, 3],
        staleTime: 5 * 60 * 1000,
        refetchInterval: 10 * 60 * 1000,
      }),
    );
  });

  it('queryFn goes through the request seam for the manifest endpoint', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { events: [], updatedAt: 'x' } }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    createWidgetQuery(agendaManifest);
    const options = mockCreateQuery.mock.calls[0][0] as { queryFn: () => Promise<unknown> };
    await options.queryFn();

    expect(fetchSpy).toHaveBeenCalledWith('/api/agenda', { method: 'GET' });
    vi.unstubAllGlobals();
  });
});

describe('createWidgetRefresh', () => {
  it('creates a refresh handler', () => {
    const refetchFn = vi.fn().mockResolvedValue(undefined);
    const handler = createWidgetRefresh(agendaManifest, refetchFn);

    expect(typeof handler).toBe('function');
  });

  it('clear-cache hits the paired cache-bust endpoint', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { events: [], updatedAt: 'x' } }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    const refetchFn = vi.fn().mockResolvedValue(undefined);
    const handler = createWidgetRefresh(agendaManifest, refetchFn);
    await handler({ clear: true });

    expect(fetchSpy).toHaveBeenCalledWith('/api/agenda/refresh', { method: 'POST' });
    expect(toast.success).toHaveBeenCalledWith('Cache cleared');
    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      ['dashboard', 'agenda'],
      { ok: true, data: { events: [], updatedAt: 'x' } },
    );
    vi.unstubAllGlobals();
  });

  it('clear-cache is a plain refetch when the endpoint has no cache-bust', async () => {
    const refetchFn = vi.fn().mockResolvedValue(undefined);
    const handler = createWidgetRefresh(watchingManifest, refetchFn);

    await handler({ clear: true });

    expect(refetchFn).toHaveBeenCalled();
  });
});
