import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { ok } from '@dashboard/shared';
import type { EpisodeProgress } from '@dashboard/shared';

const mockProgress: EpisodeProgress[] = [
  { showId: 46562, showName: 'The Last of Us', season: 3, episode: 5, watchedAt: '2026-07-28T12:00:00.000Z' },
  { showId: 690, showName: 'Stranger Things', season: 4, episode: 9, watchedAt: '2026-07-28T10:00:00.000Z' },
];

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
  },
  progress: {
    subscribe: (fn: (val: unknown) => void) => {
      fn(mockProgress);
      return () => {};
    },
  },
}));

vi.mock('$lib/show-store', () => ({
  showStore: {},
  watchlistIds: {
    subscribe: (fn: (val: unknown) => void) => {
      fn([]);
      return () => {};
    },
  },
}));

vi.mock('$lib/api-client', () => ({
  fetchProgress: vi.fn(),
  refreshProgress: vi.fn(),
  fetchEpisodes: vi.fn(),
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
});
