import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { ok } from '@dashboard/shared';
import type { ShowsData } from '@dashboard/shared';

const mockShowsData: ShowsData = {
  upcoming: [
    {
      showId: 46562,
      showName: 'The Last of Us',
      season: 3,
      number: 1,
      title: 'New Beginning',
      airdate: '2026-08-15',
      airtime: '21:00',
      runtime: 60,
    },
    {
      showId: 690,
      showName: 'Stranger Things',
      season: 5,
      premiereDate: '2026-09-01',
    },
  ],
  updatedAt: '2026-07-28T12:00:00Z',
};

const mockSearchResults = [
  {
    id: 1,
    name: 'Breaking Bad',
    status: 'Ended',
    network: { name: 'AMC' },
  },
];

vi.mock('$lib/widget-query', () => ({
  createWidgetQuery: () => ({
    subscribe: (fn: (val: unknown) => void) => {
      fn({ data: ok(mockShowsData), isLoading: false, isFetching: false });
      return () => {};
    },
  }),
  createWidgetRefresh: () => vi.fn(),
}));

vi.mock('../src/widgets/shows/search.svelte', () => ({
  createShowSearch: () => ({
    search: vi.fn(),
    results: [],
    isSearching: false,
    clear: vi.fn(),
  }),
}));

vi.mock('$lib/show-store', () => ({
  showStore: {
    addShow: vi.fn(),
    removeShow: vi.fn(),
  },
  watchlistIds: {
    subscribe: (fn: (val: unknown) => void) => {
      fn([46562]);
      return () => {};
    },
  },
}));

vi.mock('svelte-french-toast', () => ({
  default: { success: vi.fn() },
}));

vi.mock('$lib/query-client', () => ({
  queryClient: { setQueryData: vi.fn(), invalidateQueries: vi.fn() },
}));

import ShowsWidget from '../src/widgets/shows/ShowsWidget.svelte';

describe('ShowsWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders show names', () => {
    render(ShowsWidget);
    expect(screen.getByText('The Last of Us')).toBeInTheDocument();
    expect(screen.getByText('Stranger Things')).toBeInTheDocument();
  });

  it('renders upcoming episode info', () => {
    render(ShowsWidget);
    expect(screen.getByText(/S3E1 New Beginning/)).toBeInTheDocument();
  });

  it('renders season premiere info', () => {
    render(ShowsWidget);
    expect(screen.getByText(/Season 5 coming 2026-09-01/)).toBeInTheDocument();
  });

  it('renders Add show button', () => {
    render(ShowsWidget);
    expect(screen.getByText('Add show')).toBeInTheDocument();
  });

  it('renders widget title', () => {
    render(ShowsWidget);
    expect(screen.getByText('My Shows')).toBeInTheDocument();
  });
});
