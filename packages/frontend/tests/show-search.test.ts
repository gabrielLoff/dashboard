import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ok, err } from '@dashboard/shared';
import type { ShowSearchResult } from '@dashboard/shared';

const { createShowSearch } = await import('../src/widgets/shows/search.svelte');

const mockResults: ShowSearchResult[] = [
  {
    id: 1,
    name: 'Breaking Bad',
    status: 'Ended',
    premiered: '2008-01-20',
    image: { medium: 'https://example.com/med.jpg', original: 'https://example.com/orig.jpg' },
    network: { name: 'AMC' },
  },
  {
    id: 2,
    name: 'Better Call Saul',
    status: 'Ended',
    premiered: '2015-02-08',
    network: { name: 'AMC' },
  },
];

describe('createShowSearch', () => {
  let mockSearchFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockSearchFn = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with empty results and not searching', () => {
    const search = createShowSearch(mockSearchFn);

    expect(search.results).toEqual([]);
    expect(search.isSearching).toBe(false);
  });

  it('sets isSearching to true immediately when search is called', async () => {
    mockSearchFn.mockResolvedValue(ok(mockResults));
    const search = createShowSearch(mockSearchFn);

    search.search('breaking');

    expect(search.isSearching).toBe(true);
  });

  it('calls searchFn after debounce delay', async () => {
    mockSearchFn.mockResolvedValue(ok(mockResults));
    const search = createShowSearch(mockSearchFn);

    search.search('breaking');

    expect(mockSearchFn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(300);

    expect(mockSearchFn).toHaveBeenCalledWith('breaking');
  });

  it('populates results after successful search', async () => {
    mockSearchFn.mockResolvedValue(ok(mockResults));
    const search = createShowSearch(mockSearchFn);

    search.search('breaking');
    await vi.advanceTimersByTimeAsync(300);

    expect(search.results).toEqual(mockResults);
    expect(search.isSearching).toBe(false);
  });

  it('clears results on failed search', async () => {
    mockSearchFn.mockResolvedValue(err('API error'));
    const search = createShowSearch(mockSearchFn);

    search.search('breaking');
    await vi.advanceTimersByTimeAsync(300);

    expect(search.results).toEqual([]);
    expect(search.isSearching).toBe(false);
  });

  it('clears results when query is empty', async () => {
    const search = createShowSearch(mockSearchFn);

    search.search('');
    await vi.advanceTimersByTimeAsync(300);

    expect(search.results).toEqual([]);
    expect(search.isSearching).toBe(false);
    expect(mockSearchFn).not.toHaveBeenCalled();
  });

  it('clears results when query is whitespace only', async () => {
    const search = createShowSearch(mockSearchFn);

    search.search('   ');
    await vi.advanceTimersByTimeAsync(300);

    expect(search.results).toEqual([]);
    expect(search.isSearching).toBe(false);
    expect(mockSearchFn).not.toHaveBeenCalled();
  });

  it('clears previous debounce timer on new search', async () => {
    mockSearchFn.mockResolvedValue(ok(mockResults));
    const search = createShowSearch(mockSearchFn);

    search.search('break');
    await vi.advanceTimersByTimeAsync(100);
    search.search('better');
    await vi.advanceTimersByTimeAsync(300);

    expect(mockSearchFn).toHaveBeenCalledTimes(1);
    expect(mockSearchFn).toHaveBeenCalledWith('better');
  });

  it('clear() resets state and cancels debounce', async () => {
    mockSearchFn.mockResolvedValue(ok(mockResults));
    const search = createShowSearch(mockSearchFn);

    search.search('breaking');
    search.clear();

    await vi.advanceTimersByTimeAsync(300);

    expect(search.results).toEqual([]);
    expect(search.isSearching).toBe(false);
    expect(mockSearchFn).not.toHaveBeenCalled();
  });

  it('trims whitespace from query before calling searchFn', async () => {
    mockSearchFn.mockResolvedValue(ok(mockResults));
    const search = createShowSearch(mockSearchFn);

    search.search('  breaking  ');
    await vi.advanceTimersByTimeAsync(300);

    expect(mockSearchFn).toHaveBeenCalledWith('breaking');
  });

  it('uses custom debounce time', async () => {
    mockSearchFn.mockResolvedValue(ok(mockResults));
    const search = createShowSearch(mockSearchFn, 500);

    search.search('breaking');
    await vi.advanceTimersByTimeAsync(300);
    expect(mockSearchFn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(200);
    expect(mockSearchFn).toHaveBeenCalledWith('breaking');
  });
});
