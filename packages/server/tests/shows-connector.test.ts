import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { searchShows, getUpcomingEpisodes } from '../src/connectors/shows.ts';

beforeEach(() => {
  mockFetch.mockReset();
});

describe('searchShows', () => {
  it('returns empty array for empty query', async () => {
    const result = await searchShows('');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it('returns empty array for whitespace-only query', async () => {
    const result = await searchShows('   ');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it('hits TVmaze search endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await searchShows('breaking bad');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('api.tvmaze.com/search/shows?q='),
    );
  });

  it('normalizes search results to ShowSearchResult', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        {
          score: 10,
          show: {
            id: 169,
            name: 'Breaking Bad',
            status: 'Ended',
            premiered: '2008-01-20',
            ended: '2013-09-29',
            image: { medium: 'https://example.com/med.jpg', original: 'https://example.com/orig.jpg' },
            network: { name: 'AMC' },
            webChannel: null,
            summary: 'A teacher turns to crime.',
          },
        },
      ]),
    });

    const result = await searchShows('breaking');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(169);
      expect(result.data[0].name).toBe('Breaking Bad');
      expect(result.data[0].status).toBe('Ended');
      expect(result.data[0].network).toEqual({ name: 'AMC' });
    }
  });

  it('limits results to 10', async () => {
    const shows = Array.from({ length: 15 }, (_, i) => ({
      score: 10 - i,
      show: { id: i, name: `Show ${i}`, status: 'Running' },
    }));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(shows),
    });

    const result = await searchShows('show');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(10);
    }
  });

  it('returns error on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    const result = await searchShows('test');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('429');
    }
  });

  it('returns error on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await searchShows('test');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Network error');
    }
  });
});

describe('getUpcomingEpisodes', () => {
  it('returns empty upcoming for empty ids', async () => {
    const result = await getUpcomingEpisodes([]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.upcoming).toEqual([]);
    }
  });

  it('includes show with next episode', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 46562,
        name: 'The Last of Us',
        status: 'Running',
        image: { medium: 'https://example.com/img.jpg' },
        _links: { nextepisode: { href: 'https://api.tvmaze.com/episodes/1' } },
        _embedded: {
          nextepisode: {
            id: 1,
            name: 'New Beginning',
            season: 3,
            number: 1,
            airdate: '2026-08-15',
            airtime: '21:00',
            runtime: 60,
            image: { medium: 'https://example.com/ep.jpg' },
          },
        },
      }),
    });

    const result = await getUpcomingEpisodes([46562]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.upcoming).toHaveLength(1);
      const entry = result.data.upcoming[0];
      if ('number' in entry) {
        expect(entry.showId).toBe(46562);
        expect(entry.showName).toBe('The Last of Us');
        expect(entry.season).toBe(3);
        expect(entry.number).toBe(1);
        expect(entry.airdate).toBe('2026-08-15');
      }
    }
  });

  it('skips shows ended more than 1 month ago', async () => {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 169,
        name: 'Breaking Bad',
        status: 'Ended',
        ended: twoMonthsAgo.toISOString().split('T')[0],
        image: null,
        _links: {},
      }),
    });

    const result = await getUpcomingEpisodes([169]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.upcoming).toHaveLength(0);
    }
  });

  it('fetches season premiere for running show without next episode', async () => {
    const futureDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 690,
          name: 'Stranger Things',
          status: 'Running',
          image: { medium: 'https://example.com/img.jpg' },
          _links: {},
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, number: 4, premiereDate: '2025-01-01', endDate: '2025-03-01' },
          { id: 2, number: 5, premiereDate: futureDate, endDate: null },
        ]),
      });

    const result = await getUpcomingEpisodes([690]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.upcoming).toHaveLength(1);
      const entry = result.data.upcoming[0];
      if (!('number' in entry)) {
        expect(entry.showId).toBe(690);
        expect(entry.showName).toBe('Stranger Things');
        expect(entry.season).toBe(5);
        expect(entry.premiereDate).toBe(futureDate);
      }
    }
  });

  it('returns null entry for show with no next episode and no future season', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 175,
          name: 'The Office',
          status: 'Running',
          image: null,
          _links: {},
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, number: 9, premiereDate: '2012-09-20', endDate: '2013-05-16' },
        ]),
      });

    const result = await getUpcomingEpisodes([175]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.upcoming).toHaveLength(0);
    }
  });

  it('handles multiple shows', async () => {
    const futureDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/seasons')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 10, number: 2, premiereDate: futureDate, endDate: null },
          ]),
        });
      }
      if (url.includes('/shows/1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 1,
            name: 'Show A',
            status: 'Running',
            _links: {},
          }),
        });
      }
      if (url.includes('/shows/2')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 2,
            name: 'Show B',
            status: 'Running',
            _embedded: {
              nextepisode: {
                id: 20,
                name: 'Finale',
                season: 1,
                number: 10,
                airdate: '2026-08-01',
                airtime: '20:00',
                runtime: 45,
              },
            },
            _links: { nextepisode: { href: 'https://api.tvmaze.com/episodes/20' } },
          }),
        });
      }
      return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found' });
    });

    const result = await getUpcomingEpisodes([1, 2]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.upcoming).toHaveLength(2);
    }
  });

  it('returns empty upcoming when all fetches fail', async () => {
    mockFetch.mockRejectedValue(new Error('Connection refused'));

    const result = await getUpcomingEpisodes([999]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.upcoming).toHaveLength(0);
    }
  });
});
