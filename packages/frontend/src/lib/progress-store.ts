import { writable, derived, get } from 'svelte/store';
import type { EpisodeProgress } from '@dashboard/shared';

const STORAGE_KEY = 'dashboard-episode-progress';

// --- Types ---

export interface ProgressState {
  progress: EpisodeProgress[];
}

export type ProgressAction =
  | { type: 'SET_PROGRESS'; progress: EpisodeProgress[] }
  | { type: 'ADVANCE_EPISODE'; showId: number; showName: string; season: number; episode: number }
  | { type: 'RESET_SHOW'; showId: number }
  | { type: 'RESET_ALL' };

// --- Reducer ---

export function progressReducer(state: ProgressState, action: ProgressAction): ProgressState {
  switch (action.type) {
    case 'SET_PROGRESS':
      return { progress: action.progress };

    case 'ADVANCE_EPISODE': {
      const existing = state.progress.find((p) => p.showId === action.showId);
      if (existing) {
        return {
          progress: state.progress.map((p) =>
            p.showId === action.showId
              ? { ...p, season: action.season, episode: action.episode, watchedAt: new Date().toISOString() }
              : p,
          ),
        };
      }
      return {
        progress: [
          ...state.progress,
          {
            showId: action.showId,
            showName: action.showName,
            season: action.season,
            episode: action.episode,
            watchedAt: new Date().toISOString(),
          },
        ],
      };
    }

    case 'RESET_SHOW':
      return {
        progress: state.progress.filter((p) => p.showId !== action.showId),
      };

    case 'RESET_ALL':
      return { progress: [] };

    default:
      return state;
  }
}

// --- Persistence ---

function loadFromStorage(): ProgressState {
  if (typeof localStorage === 'undefined') return { progress: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { progress: [] };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { progress: parsed };
    return { progress: [] };
  } catch {
    return { progress: [] };
  }
}

function saveToStorage(state: ProgressState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

// --- Store ---

function createStore() {
  const initial = loadFromStorage();
  const { subscribe, update, set } = writable<ProgressState>(initial);

  subscribe((state) => {
    saveToStorage(state);
  });

  return {
    subscribe,
    dispatch(action: ProgressAction) {
      update((state) => progressReducer(state, action));
    },
    setProgress(progress: EpisodeProgress[]) {
      set({ progress });
    },
    getProgress(showId: number): EpisodeProgress | undefined {
      const state = get({ subscribe });
      return state.progress.find((p) => p.showId === showId);
    },
    reset() {
      set({ progress: [] });
    },
  };
}

export const progressStore = createStore();

// --- Derived values ---

export const progress = derived(progressStore, ($store) => $store.progress);

export const progressCount = derived(progress, ($progress) => $progress.length);
