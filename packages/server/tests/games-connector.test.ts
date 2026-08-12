import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { fetchGames, VALID_TYPES, VALID_PLATFORMS } from '../src/connectors/games.ts';

const mockGamesResponse = [
  {
    id: 1,
    title: 'Celeste',
    platforms: 'PC, Steam',
    type: 'Game',
    open_giveaway_url: 'https://example.com/celeste',
    end_date: '2026-08-01 23:59:59',
    image: 'https://example.com/celeste.jpg',
  },
  {
    id: 2,
    title: 'Into the Breach',
    platforms: 'PC, Steam, DRM-Free',
    type: 'Game',
    open_giveaway_url: 'https://example.com/itb',
    end_date: 'N/A',
    image: 'https://example.com/itb.jpg',
  },
  {
    id: 3,
    title: 'Loot Pack',
    platforms: 'PC',
    type: 'Loot',
    open_giveaway_url: 'https://example.com/loot',
    end_date: '',
    image: 'https://example.com/loot.jpg',
  },
];

describe('fetchGames', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches from GamerPower API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGamesResponse),
    });

    await fetchGames();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('gamerpower.com/api/giveaways'),
    );
  });

  it('returns FreeGamesData with correct shape', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockGamesResponse),
    });

    const result = await fetchGames();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.games).toHaveLength(3);
      expect(result.data.totalResults).toBe(3);
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(12);
      expect(result.data.updatedAt).toBeDefined();
    }
  });

  it('maps game fields correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockGamesResponse[0]]),
    });

    const result = await fetchGames();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.games[0]).toEqual({
        id: '1',
        title: 'Celeste',
        platform: 'PC, Steam',
        source: 'Game',
        url: 'https://example.com/celeste',
        expiryDate: '2026-08-01',
        imageUrl: 'https://example.com/celeste.jpg',
      });
    }
  });

  it('handles N/A end date', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockGamesResponse[1]]),
    });

    const result = await fetchGames();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.games[0].expiryDate).toBe('');
    }
  });

  it('handles empty end date', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockGamesResponse[2]]),
    });

    const result = await fetchGames();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.games[0].expiryDate).toBe('');
    }
  });

  it('paginates results', async () => {
    const manyGames = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      title: `Game ${i + 1}`,
      platforms: 'PC',
      type: 'Game',
      open_giveaway_url: `https://example.com/${i + 1}`,
      end_date: '',
      image: '',
    }));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(manyGames),
    });

    const page1 = await fetchGames({ page: 1 });
    expect(page1.ok).toBe(true);
    if (page1.ok) {
      expect(page1.data.games).toHaveLength(12);
      expect(page1.data.totalResults).toBe(20);
      expect(page1.data.page).toBe(1);
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(manyGames),
    });

    const page2 = await fetchGames({ page: 2 });
    expect(page2.ok).toBe(true);
    if (page2.ok) {
      expect(page2.data.games).toHaveLength(8);
      expect(page2.data.page).toBe(2);
    }
  });

  it('passes type and platform filters as query params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await fetchGames({ type: 'loot', platform: 'steam' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('type=loot'),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('platform=steam'),
    );
  });

  it('returns error on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    const result = await fetchGames();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('429');
    }
  });

  it('returns error on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await fetchGames();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Network error');
    }
  });
});

describe('validation constants', () => {
  it('VALID_TYPES contains expected values', () => {
    expect(VALID_TYPES).toEqual(['game', 'loot', 'beta']);
  });

  it('VALID_PLATFORMS contains expected values', () => {
    expect(VALID_PLATFORMS).toEqual(['pc', 'steam', 'epic-games-store', 'gog', 'drm-free', 'itchio']);
  });
});
