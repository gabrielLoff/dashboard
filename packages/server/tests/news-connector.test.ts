import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { fetchNews, buildQueryParams } from '../src/connectors/news.ts';

describe('buildQueryParams', () => {
  it('returns empty params for empty filters', () => {
    const params = buildQueryParams({});
    expect(params.toString()).toBe('');
  });

  it('sets country param when provided', () => {
    const params = buildQueryParams({ country: 'us' });
    expect(params.get('country')).toBe('us');
  });

  it('sets category param when provided', () => {
    const params = buildQueryParams({ category: 'technology' });
    expect(params.get('category')).toBe('technology');
  });

  it('sets both params when both provided', () => {
    const params = buildQueryParams({ country: 'br', category: 'sports' });
    expect(params.get('country')).toBe('br');
    expect(params.get('category')).toBe('sports');
  });
});

describe('fetchNews', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('hits /v1/latest-news endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ news: [] }),
    });

    await fetchNews();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/latest-news'),
      expect.any(Object),
    );
  });

  it('sends Authorization header with CURRENTS_API_KEY', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ news: [] }),
    });

    await fetchNews();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: expect.any(String) }),
      }),
    );
  });

  it('maps Currents response to NewsData', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          news: [
            {
              title: 'Test Title',
              source: 'Test Source',
              url: 'https://example.com',
              published: '2026-01-01T00:00:00Z',
              description: 'Test description',
              image: 'https://example.com/image.jpg',
            },
          ],
        }),
    });

    const result = await fetchNews();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0]).toEqual({
        id: '0',
        title: 'Test Title',
        source: 'Test Source',
        url: 'https://example.com',
        publishedAt: '2026-01-01T00:00:00Z',
        summary: 'Test description',
        imageUrl: 'https://example.com/image.jpg',
      });
    }
  });

  it('omits imageUrl when image is null', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          news: [
            {
              title: 'No Image',
              source: 'Source',
              url: 'https://example.com',
              published: '2026-01-01T00:00:00Z',
              description: 'Desc',
              image: null,
            },
          ],
        }),
    });

    const result = await fetchNews();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.items[0]).not.toHaveProperty('imageUrl');
    }
  });

  it('returns error on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    const result = await fetchNews();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('429');
    }
  });

  it('returns error on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchNews();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Network error');
    }
  });
});
