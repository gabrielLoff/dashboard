import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

const STORAGE_KEY = 'dashboard-shows-watchlist';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

// Import after mocking
const { showStore, watchlist, watchlistIds, watchlistCount } = await import('../src/lib/show-store');

beforeEach(() => {
  localStorageMock.clear();
  showStore.reset();
  vi.clearAllMocks();
});

describe('showStore', () => {
  describe('addShow', () => {
    it('adds a show to the watchlist', () => {
      const result = showStore.addShow(169, 'Breaking Bad');
      expect(result).toBe(true);
      expect(get(watchlist)).toHaveLength(1);
      expect(get(watchlist)[0].id).toBe(169);
      expect(get(watchlist)[0].name).toBe('Breaking Bad');
    });

    it('adds show with image', () => {
      showStore.addShow(169, 'Breaking Bad', 'https://example.com/img.jpg');
      const entry = get(watchlist)[0];
      expect(entry.image).toBe('https://example.com/img.jpg');
    });

    it('sets addedAt timestamp', () => {
      showStore.addShow(169, 'Breaking Bad');
      const entry = get(watchlist)[0];
      expect(entry.addedAt).toBeDefined();
      expect(new Date(entry.addedAt).toISOString()).toBe(entry.addedAt);
    });

    it('does not add duplicate shows', () => {
      showStore.addShow(169, 'Breaking Bad');
      showStore.addShow(169, 'Breaking Bad');
      expect(get(watchlist)).toHaveLength(1);
    });

    it('returns false when max shows reached', () => {
      for (let i = 1; i <= 50; i++) {
        showStore.addShow(i, `Show ${i}`);
      }
      const result = showStore.addShow(51, 'Show 51');
      expect(result).toBe(false);
      expect(get(watchlist)).toHaveLength(50);
    });

    it('allows adding after removing', () => {
      showStore.addShow(1, 'Show 1');
      showStore.removeShow(1);
      const result = showStore.addShow(2, 'Show 2');
      expect(result).toBe(true);
      expect(get(watchlist)).toHaveLength(1);
    });
  });

  describe('removeShow', () => {
    it('removes a show by id', () => {
      showStore.addShow(169, 'Breaking Bad');
      showStore.removeShow(169);
      expect(get(watchlist)).toHaveLength(0);
    });

    it('does nothing for non-existent id', () => {
      showStore.addShow(169, 'Breaking Bad');
      showStore.removeShow(999);
      expect(get(watchlist)).toHaveLength(1);
    });
  });

  describe('hasShow', () => {
    it('returns true for tracked show', () => {
      showStore.addShow(169, 'Breaking Bad');
      expect(showStore.hasShow(169)).toBe(true);
    });

    it('returns false for untracked show', () => {
      expect(showStore.hasShow(169)).toBe(false);
    });
  });

  describe('getWatchlist', () => {
    it('returns all entries', () => {
      showStore.addShow(169, 'Breaking Bad');
      showStore.addShow(46562, 'The Last of Us');
      expect(showStore.getWatchlist()).toHaveLength(2);
    });

    it('returns empty array when empty', () => {
      expect(showStore.getWatchlist()).toEqual([]);
    });
  });

  describe('reset', () => {
    it('clears all entries', () => {
      showStore.addShow(169, 'Breaking Bad');
      showStore.reset();
      expect(get(watchlist)).toHaveLength(0);
    });
  });

  describe('persistence', () => {
    it('persists to localStorage on add', () => {
      showStore.addShow(169, 'Breaking Bad');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.any(String),
      );
    });

    it('persists to localStorage on remove', () => {
      showStore.addShow(169, 'Breaking Bad');
      showStore.removeShow(169);
      const lastCall = localStorageMock.setItem.mock.calls.at(-1);
      expect(lastCall?.[0]).toBe(STORAGE_KEY);
      expect(JSON.parse(lastCall?.[1])).toEqual([]);
    });

    it('loads from localStorage on init', async () => {
      const entries = [{ id: 169, name: 'Breaking Bad', addedAt: '2026-07-28T00:00:00.000Z' }];
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(entries));

      // Re-import to trigger fresh load
      vi.resetModules();
      const mod = await import('../src/lib/show-store');
      expect(get(mod.watchlist)).toHaveLength(1);
      expect(get(mod.watchlist)[0].id).toBe(169);
    });
  });
});

describe('derived stores', () => {
  it('watchlistIds returns array of ids', () => {
    showStore.addShow(169, 'Breaking Bad');
    showStore.addShow(46562, 'The Last of Us');
    expect(get(watchlistIds)).toEqual([169, 46562]);
  });

  it('watchlistCount returns count', () => {
    showStore.addShow(169, 'Breaking Bad');
    expect(get(watchlistCount)).toBe(1);
  });
});
