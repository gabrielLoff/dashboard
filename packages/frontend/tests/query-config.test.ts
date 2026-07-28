import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tanstack/svelte-query', () => ({
  createQuery: vi.fn(),
}));

vi.mock('../src/lib/api-client.ts', () => ({
  fetchWeather: vi.fn(),
  fetchNews: vi.fn(),
  fetchAgenda: vi.fn(),
  fetchGames: vi.fn(),
}));

import { createQuery } from '@tanstack/svelte-query';
import { fetchWeather, fetchNews, fetchAgenda, fetchGames } from '../src/lib/api-client.ts';
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

  it('passes fetchWeather to queryFn for weather', () => {
    useSourceQuery('weather');

    const options = mockCreateQuery.mock.calls[0][0];
    options.queryFn();

    expect(fetchWeather).toHaveBeenCalledOnce();
  });

  it('passes fetchNews to queryFn for news', () => {
    useSourceQuery('news');

    const options = mockCreateQuery.mock.calls[0][0];
    options.queryFn();

    expect(fetchNews).toHaveBeenCalledOnce();
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

  it('passes news filters to fetchNews via queryFn', () => {
    const filters = { country: 'br', category: 'sports' };
    useSourceQuery('news', filters);

    const options = mockCreateQuery.mock.calls[0][0];
    options.queryFn();

    expect(fetchNews).toHaveBeenCalledWith(filters);
  });

  it('passes fetchAgenda to queryFn for agenda', () => {
    useSourceQuery('agenda');

    const options = mockCreateQuery.mock.calls[0][0];
    options.queryFn();

    expect(fetchAgenda).toHaveBeenCalledOnce();
  });

  it('passes fetchGames to queryFn for games', () => {
    useSourceQuery('games');

    const options = mockCreateQuery.mock.calls[0][0];
    options.queryFn();

    expect(fetchGames).toHaveBeenCalledOnce();
  });

  it('throws for unknown source', () => {
    expect(() => useSourceQuery('unknown' as never)).toThrow('Unknown source: unknown');
  });
});
