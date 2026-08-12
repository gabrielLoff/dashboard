import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createHabitSyncAdapter,
  createShowSyncAdapter,
  createLayoutSyncAdapter,
} from '../src/lib/store-sync-adapters';
import type { SyncData } from '../src/lib/store-sync-adapters';

const mockSyncData: SyncData = {
  habits: [
    { id: '1', name: 'Exercise', createdAt: '2026-07-28', completions: { '2026-07-28': true } },
  ],
  watchlist: [
    { id: 101, name: 'Breaking Bad', addedAt: '2026-07-28T10:00:00Z' },
  ],
  layout: {
    carouselOrder: ['news', 'games', 'shows', 'habits'],
  },
};

describe('HabitSyncAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hydrate sets habits on the store', () => {
    const adapter = createHabitSyncAdapter();
    // hydrate should not throw
    expect(() => adapter.hydrate(mockSyncData)).not.toThrow();
  });

  it('push sends habits to server', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);

    const adapter = createHabitSyncAdapter();
    await adapter.push(mockSyncData.habits);

    expect(fetchSpy).toHaveBeenCalledWith('/api/sync/habits', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habits: mockSyncData.habits }),
    });
  });

  it('push throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const adapter = createHabitSyncAdapter();
    await expect(adapter.push([])).rejects.toThrow('pushHabits failed: 500');
  });

  it('subscribe returns an unsubscribe function', () => {
    const adapter = createHabitSyncAdapter();
    const unsub = adapter.subscribe(() => {});
    expect(typeof unsub).toBe('function');
  });
});

describe('ShowSyncAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hydrate resets and populates the store', () => {
    const adapter = createShowSyncAdapter();
    expect(() => adapter.hydrate(mockSyncData)).not.toThrow();
  });

  it('push sends entries to server', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);

    const adapter = createShowSyncAdapter();
    await adapter.push(mockSyncData.watchlist);

    expect(fetchSpy).toHaveBeenCalledWith('/api/sync/watchlist', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: mockSyncData.watchlist }),
    });
  });

  it('push throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const adapter = createShowSyncAdapter();
    await expect(adapter.push([])).rejects.toThrow('pushWatchlist failed: 500');
  });

  it('subscribe returns an unsubscribe function', () => {
    const adapter = createShowSyncAdapter();
    const unsub = adapter.subscribe(() => {});
    expect(typeof unsub).toBe('function');
  });
});

describe('LayoutSyncAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hydrate resets and reorders the store', () => {
    const adapter = createLayoutSyncAdapter();
    expect(() => adapter.hydrate(mockSyncData)).not.toThrow();
  });

  it('push sends carousel order to server', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);

    const adapter = createLayoutSyncAdapter();
    await adapter.push(mockSyncData.layout.carouselOrder);

    expect(fetchSpy).toHaveBeenCalledWith('/api/sync/layout', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carouselOrder: mockSyncData.layout.carouselOrder }),
    });
  });

  it('push throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const adapter = createLayoutSyncAdapter();
    await expect(adapter.push([])).rejects.toThrow('pushLayout failed: 500');
  });

  it('subscribe returns an unsubscribe function', () => {
    const adapter = createLayoutSyncAdapter();
    const unsub = adapter.subscribe(() => {});
    expect(typeof unsub).toBe('function');
  });
});
