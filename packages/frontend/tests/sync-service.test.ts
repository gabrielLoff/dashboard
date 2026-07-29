import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  pullAll,
  pushHabits,
  pushWatchlist,
  pushLayout,
  initSync,
  pushHabitsSafe,
  pushWatchlistSafe,
  pushLayoutSafe,
  type SyncData,
} from '../src/lib/sync-service';

const mockSyncData: SyncData = {
  habits: [
    { id: '1', name: 'Exercise', createdAt: '2026-07-28', completions: { '2026-07-28': true } },
  ],
  watchlist: [
    { id: 101, name: 'Breaking Bad', addedAt: '2026-07-28T10:00:00Z' },
  ],
  layout: {
    order: ['weather', 'news', 'agenda', 'games', 'shows', 'habits'],
    widgets: { weather: { size: 'wide' } },
  },
};

function mockFetch(data: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(data),
  });
}

describe('pullAll', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch({ ok: true, data: mockSyncData }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns data on success', async () => {
    const result = await pullAll();
    expect(result).toEqual({ ok: true, data: mockSyncData });
  });

  it('returns error when ok is false', async () => {
    vi.stubGlobal('fetch', mockFetch({ ok: false, error: 'fail' }));
    const result = await pullAll();
    expect(result).toEqual({ ok: false, error: 'fail' });
  });

  it('returns error on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    const result = await pullAll();
    expect(result).toEqual({ ok: false, error: 'Network error' });
  });
});

describe('pushHabits', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends habits to server', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);

    await pushHabits(mockSyncData.habits);

    expect(fetchSpy).toHaveBeenCalledWith('/api/sync/habits', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habits: mockSyncData.habits }),
    });
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(pushHabits([])).rejects.toThrow('pushHabits failed: 500');
  });
});

describe('pushWatchlist', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends entries to server', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);

    await pushWatchlist(mockSyncData.watchlist);

    expect(fetchSpy).toHaveBeenCalledWith('/api/sync/watchlist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: mockSyncData.watchlist }),
    });
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(pushWatchlist([])).rejects.toThrow('pushWatchlist failed: 500');
  });
});

describe('pushLayout', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends layout to server', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);

    const { order, widgets } = mockSyncData.layout;
    await pushLayout(order, widgets);

    expect(fetchSpy).toHaveBeenCalledWith('/api/sync/layout', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order, widgets }),
    });
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(pushLayout([], {})).rejects.toThrow('pushLayout failed: 500');
  });
});

describe('initSync', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch({ ok: true, data: mockSyncData }));
    vi.stubGlobal('window', { addEventListener: vi.fn() });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns server data on success', async () => {
    const result = await initSync();
    expect(result).toEqual(mockSyncData);
  });

  it('returns null when server is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    const result = await initSync();
    expect(result).toBeNull();
  });
});

describe('pushHabitsSafe', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls pushHabits and does not throw on failure', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchSpy);

    expect(() => pushHabitsSafe(mockSyncData.habits)).not.toThrow();
  });
});

describe('pushWatchlistSafe', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls pushWatchlist and does not throw on failure', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchSpy);

    expect(() => pushWatchlistSafe(mockSyncData.watchlist)).not.toThrow();
  });
});

describe('pushLayoutSafe', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls pushLayout and does not throw on failure', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchSpy);

    expect(() => pushLayoutSafe(mockSyncData.layout.order, mockSyncData.layout.widgets)).not.toThrow();
  });
});
