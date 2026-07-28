import { writable, derived, get } from 'svelte/store';

const STORAGE_KEY = 'dashboard-shows-watchlist';
const MAX_SHOWS = 50;

// --- Types ---

export interface WatchlistEntry {
  id: number;
  name: string;
  image?: string;
  addedAt: string;
}

export interface WatchlistState {
  entries: WatchlistEntry[];
}

// --- Persistence ---

function loadFromStorage(): WatchlistState {
  if (typeof localStorage === 'undefined') return { entries: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [] };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { entries: parsed };
    return { entries: [] };
  } catch {
    return { entries: [] };
  }
}

function saveToStorage(state: WatchlistState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

// --- Store ---

function createStore() {
  const initial = loadFromStorage();
  const { subscribe, update, set } = writable<WatchlistState>(initial);

  // Persist on every mutation
  subscribe((state) => {
    saveToStorage(state);
  });

  return {
    subscribe,
    addShow(id: number, name: string, image?: string): boolean {
      let added = false;
      update((state) => {
        if (state.entries.some((e) => e.id === id)) return state;
        if (state.entries.length >= MAX_SHOWS) return state;
        added = true;
        return {
          entries: [
            ...state.entries,
            { id, name, image, addedAt: new Date().toISOString() },
          ],
        };
      });
      return added;
    },
    removeShow(id: number) {
      update((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
      }));
    },
    hasShow(id: number): boolean {
      const state = get({ subscribe });
      return state.entries.some((e) => e.id === id);
    },
    getWatchlist(): WatchlistEntry[] {
      const state = get({ subscribe });
      return state.entries;
    },
    reset() {
      set({ entries: [] });
    },
  };
}

export const showStore = createStore();

// --- Derived values ---

export const watchlist = derived(showStore, ($store) => $store.entries);
export const watchlistIds = derived(watchlist, ($entries) => $entries.map((e) => e.id));
export const watchlistCount = derived(watchlist, ($entries) => $entries.length);
