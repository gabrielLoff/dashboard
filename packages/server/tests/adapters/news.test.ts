import { describe, it, expect, vi } from 'vitest';
import { mockNewsFetcher } from '../../src/adapters/news.ts';

vi.mock('../../src/mock-data.ts', () => ({
  getMockNews: vi.fn(() => ({
    ok: true,
    data: {
      items: [
        {
          id: '1',
          title: 'Test Headline',
          source: 'Test Source',
          url: 'https://example.com/test',
          publishedAt: '2025-01-01T00:00:00.000Z',
          summary: 'A test news summary.',
        },
      ],
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
  })),
}));

describe('mockNewsFetcher', () => {
  it('returns a successful news result', async () => {
    const result = await mockNewsFetcher.fetch();
    expect(result.ok).toBe(true);
  });

  it('returns NewsData with expected shape', async () => {
    const result = await mockNewsFetcher.fetch();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveProperty('items');
      expect(result.data).toHaveProperty('updatedAt');
      expect(Array.isArray(result.data.items)).toBe(true);
    }
  });

  it('returns fixture data from getMockNews', async () => {
    const result = await mockNewsFetcher.fetch();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.items[0].title).toBe('Test Headline');
    }
  });

  it('accepts filters argument', async () => {
    const result = await mockNewsFetcher.fetch({ country: 'us', category: 'technology' });
    expect(result.ok).toBe(true);
  });
});