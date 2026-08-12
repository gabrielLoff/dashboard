import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  pullAll,
  initSync,
  SyncOrchestrator,
  type SyncData,
} from '../src/lib/sync-service';
import type { StoreSyncAdapter } from '../src/lib/store-sync-adapters';

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

function mockFetch(data: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(data),
  });
}

function createMockAdapter<T>(data: T): StoreSyncAdapter<T> {
  return {
    hydrate: vi.fn(),
    push: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockReturnValue(() => {}),
  };
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

describe('SyncOrchestrator', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch({ ok: true, data: mockSyncData }));
    vi.stubGlobal('window', { addEventListener: vi.fn() });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hydrates all adapters with server data', async () => {
    const adapter = createMockAdapter(mockSyncData);
    const orchestrator = new SyncOrchestrator([adapter]);

    await orchestrator.init();

    expect(adapter.hydrate).toHaveBeenCalledWith(mockSyncData);
  });

  it('subscribes to all adapters', async () => {
    const adapter = createMockAdapter(mockSyncData);
    const orchestrator = new SyncOrchestrator([adapter]);

    await orchestrator.init();

    expect(adapter.subscribe).toHaveBeenCalled();
  });

  it('sets up online listener', async () => {
    const addEventListenerSpy = vi.fn();
    vi.stubGlobal('window', { addEventListener: addEventListenerSpy });

    const adapter = createMockAdapter(mockSyncData);
    const orchestrator = new SyncOrchestrator([adapter]);

    await orchestrator.init();

    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
  });

  it('returns server data on success', async () => {
    const adapter = createMockAdapter(mockSyncData);
    const orchestrator = new SyncOrchestrator([adapter]);

    const result = await orchestrator.init();

    expect(result).toEqual(mockSyncData);
  });

  it('returns null when server is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

    const adapter = createMockAdapter(mockSyncData);
    const orchestrator = new SyncOrchestrator([adapter]);

    const result = await orchestrator.init();

    expect(result).toBeNull();
  });

  it('still subscribes even when server fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

    const adapter = createMockAdapter(mockSyncData);
    const orchestrator = new SyncOrchestrator([adapter]);

    await orchestrator.init();

    expect(adapter.subscribe).toHaveBeenCalled();
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

  it('creates orchestrator and initializes with adapters', async () => {
    const adapter = createMockAdapter(mockSyncData);

    const result = await initSync([adapter]);

    expect(result).toEqual(mockSyncData);
    expect(adapter.hydrate).toHaveBeenCalled();
  });
});
