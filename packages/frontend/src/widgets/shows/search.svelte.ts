import { isOk, type ShowSearchResult } from '@dashboard/shared';
import type { ApiResult } from '@dashboard/shared';

export interface ShowSearchModule {
  search(query: string): void;
  results: ShowSearchResult[];
  isSearching: boolean;
  clear(): void;
}

export function createShowSearch(
  searchFn: (query: string) => Promise<ApiResult<ShowSearchResult[]>>,
  debounceMs = 300,
): ShowSearchModule {
  let results: ShowSearchResult[] = $state([]);
  let isSearching = $state(false);
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function search(query: string) {
    if (debounceTimer) clearTimeout(debounceTimer);

    if (!query.trim()) {
      results = [];
      isSearching = false;
      return;
    }

    isSearching = true;
    debounceTimer = setTimeout(async () => {
      const result = await searchFn(query.trim());
      if (isOk(result)) {
        results = result.data;
      } else {
        results = [];
      }
      isSearching = false;
    }, debounceMs);
  }

  function clear() {
    if (debounceTimer) clearTimeout(debounceTimer);
    results = [];
    isSearching = false;
  }

  return {
    search,
    get results() { return results; },
    get isSearching() { return isSearching; },
    clear,
  };
}
