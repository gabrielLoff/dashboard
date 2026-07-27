import { describe, it, expect, vi } from 'vitest';
import { mockGamesFetcher } from '../../src/adapters/games.ts';

vi.mock('../../src/mock-data.ts', () => ({
  getMockGames: vi.fn(() => ({
    ok: true,
    data: {
      games: [
        {
          id: '1',
          title: 'Test Game',
          platform: 'PC',
          source: 'game',
          url: 'https://example.com/test',
          expiryDate: '2025-12-31',
          imageUrl: 'https://example.com/image.png',
        },
      ],
      totalResults: 1,
      page: 1,
      pageSize: 12,
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
  })),
}));

describe('mockGamesFetcher', () => {
  it('returns a successful games result', async () => {
    const result = await mockGamesFetcher.fetch({});
    expect(result.ok).toBe(true);
  });

  it('returns FreeGamesData with expected shape', async () => {
    const result = await mockGamesFetcher.fetch({});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveProperty('games');
      expect(result.data).toHaveProperty('totalResults');
      expect(result.data).toHaveProperty('page');
      expect(result.data).toHaveProperty('pageSize');
      expect(result.data).toHaveProperty('updatedAt');
      expect(Array.isArray(result.data.games)).toBe(true);
    }
  });

  it('accepts filters argument', async () => {
    const result = await mockGamesFetcher.fetch({ type: 'game', platform: 'pc', page: 1 });
    expect(result.ok).toBe(true);
  });

  it('returns fixture data from getMockGames', async () => {
    const result = await mockGamesFetcher.fetch({});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.games[0].title).toBe('Test Game');
    }
  });
});