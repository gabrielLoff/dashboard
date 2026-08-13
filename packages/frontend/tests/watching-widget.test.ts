import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { ok } from '@dashboard/shared';
import type { EpisodeProgress } from '@dashboard/shared';

const mockProgress: EpisodeProgress[] = [
  { showId: 46562, showName: 'The Last of Us', season: 3, episode: 5, watchedAt: '2026-07-28T12:00:00.000Z' },
  { showId: 690, showName: 'Stranger Things', season: 4, episode: 9, watchedAt: '2026-07-28T10:00:00.000Z' },
];

const mockWatchlist = [
  { id: 46562, name: 'The Last of Us', addedAt: '2026-07-28T00:00:00.000Z' },
  { id: 690, name: 'Stranger Things', addedAt: '2026-07-28T00:00:00.000Z' },
];

const mockEpisodeCounts: Record<number, number> = {
  46562: 65,
  690: 50,
};

const { mockFetchEpisodes } = vi.hoisted(() => ({
  mockFetchEpisodes: vi.fn(),
}));

vi.mock('$lib/widget-query', () => ({
  createWidgetQuery: () => ({
    subscribe: (fn: (val: unknown) => void) => {
      fn({ data: ok(mockProgress), isLoading: false, isFetching: false });
      return () => {};
    },
  }),
  createWidgetRefresh: () => vi.fn(),
}));

vi.mock('$lib/progress-store', () => ({
  progressStore: {
    dispatch: vi.fn(),
    setEpisodeCount: vi.fn(),
  },
  progress: {
    subscribe: (fn: (val: unknown) => void) => {
      fn(mockProgress);
      return () => {};
    },
  },
  episodeCounts: {
    subscribe: (fn: (val: unknown) => void) => {
      fn(mockEpisodeCounts);
      return () => {};
    },
  },
}));

vi.mock('$lib/show-store', () => ({
  showStore: {},
  watchlist: {
    subscribe: (fn: (val: unknown) => void) => {
      fn(mockWatchlist);
      return () => {};
    },
  },
  watchlistIds: {
    subscribe: (fn: (val: unknown) => void) => {
      fn([46562, 690]);
      return () => {};
    },
  },
}));

vi.mock('$lib/api-client', () => ({
  fetchProgress: vi.fn(),
  refreshProgress: vi.fn(),
  fetchEpisodes: mockFetchEpisodes,
}));

vi.mock('svelte-french-toast', () => ({
  default: { success: vi.fn() },
}));

vi.mock('$lib/query-client', () => ({
  queryClient: { setQueryData: vi.fn(), invalidateQueries: vi.fn() },
}));

import WatchingWidget from '../src/widgets/watching/WatchingWidget.svelte';

describe('WatchingWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchEpisodes.mockResolvedValue(ok([]));
  });

  it('renders show names', () => {
    render(WatchingWidget);
    expect(screen.getByText('The Last of Us')).toBeInTheDocument();
    expect(screen.getByText('Stranger Things')).toBeInTheDocument();
  });

  it('renders progress format', () => {
    render(WatchingWidget);
    expect(screen.getByText('S3E5')).toBeInTheDocument();
    expect(screen.getByText('S4E9')).toBeInTheDocument();
  });

  it('renders widget title', () => {
    render(WatchingWidget);
    expect(screen.getByText('Watching')).toBeInTheDocument();
  });

  it('renders progress bars', () => {
    const { container } = render(WatchingWidget);
    const bars = container.querySelectorAll('[style*="width"]');
    expect(bars.length).toBeGreaterThan(0);
  });

  it('progress bar has green gradient class', () => {
    const { container } = render(WatchingWidget);
    const bars = container.querySelectorAll('.bg-gradient-to-r');
    expect(bars.length).toBeGreaterThan(0);
    expect(bars[0]).toHaveClass('from-green-400');
  });

  it('progress bar has transition class', () => {
    const { container } = render(WatchingWidget);
    const bars = container.querySelectorAll('.transition-all');
    expect(bars.length).toBeGreaterThan(0);
    expect(bars[0]).toHaveClass('duration-500');
  });
});
