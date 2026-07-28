import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';

vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

vi.mock('$lib/query-config', () => ({
  useSourceQuery: () => ({
    subscribe: (fn: (val: unknown) => void) => {
      fn({
        data: {
          ok: true,
          data: {
            games: [
              {
                id: '1',
                title: 'Celeste',
                platform: 'PC, Steam',
                source: 'Game',
                url: 'https://example.com/celeste',
                expiryDate: new Date(Date.now() + 604800000).toISOString().split('T')[0],
                imageUrl: 'https://placehold.co/200x120/6366f1/ffffff?text=Celeste',
              },
              {
                id: '2',
                title: 'Into the Breach',
                platform: 'PC, Steam, DRM-Free',
                source: 'Game',
                url: 'https://example.com/itb',
                expiryDate: new Date(Date.now() + 604800000).toISOString().split('T')[0],
                imageUrl: 'https://placehold.co/200x120/8b5cf6/ffffff?text=ITB',
              },
            ],
            totalResults: 2,
            page: 1,
            pageSize: 12,
            updatedAt: '2026-07-28T12:00:00Z',
          },
        },
        isLoading: false,
        isFetching: false,
      });
      return () => {};
    },
  }),
}));

vi.mock('$lib/api-client', () => ({
  refreshGames: vi.fn(),
  fetchGames: vi.fn(),
}));

vi.mock('svelte-french-toast', () => ({
  default: { success: vi.fn() },
}));

vi.mock('$lib/query-client', () => ({
  queryClient: { setQueryData: vi.fn(), invalidateQueries: vi.fn() },
}));

import GamesWidget from '../src/widgets/games/GamesWidget.svelte';

describe('GamesWidget', () => {
  it('renders game titles', () => {
    render(GamesWidget);
    expect(screen.getByText('Celeste')).toBeInTheDocument();
    expect(screen.getByText('Into the Breach')).toBeInTheDocument();
  });

  it('renders game images', () => {
    render(GamesWidget);
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'https://placehold.co/200x120/6366f1/ffffff?text=Celeste');
  });

  it('renders type filter dropdown', () => {
    render(GamesWidget);
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  it('renders platform filter dropdown', () => {
    render(GamesWidget);
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(2);
  });

  it('renders Powered by GamerPower', () => {
    render(GamesWidget);
    expect(screen.getByText('GamerPower')).toBeInTheDocument();
  });

  it('does not show Load more when all results fit', () => {
    render(GamesWidget);
    expect(screen.queryByText('Load more')).not.toBeInTheDocument();
  });
});
