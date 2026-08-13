import { writable, derived, get } from 'svelte/store';
import type { EpisodeProgress } from '@dashboard/shared';

const STORAGE_KEY = 'dashboard-episode-progress';

// --- Types ---

export interface ProgressState {
  progress: EpisodeProgress[];
  episodeCounts: Record<number, number>;
}

export type ProgressAction =
  | { type: 'SET_PROGRESS'; progress: EpisodeProgress[] }
  | { type: 'ADVANCE_EPISODE'; showId: number; showName: string; season: number; episode: number }
  | { type: 'RESET_SHOW'; showId: number }
  | { type: 'RESET_ALL' }
  | { type: 'SET_EPISODE_COUNT'; showId: number; count: number }
  | { type: 'SET_EPISODE_COUNTS'; counts: Record<number, number> };

// --- Reducer ---

export function progressReducer(state: ProgressState, action: ProgressAction): ProgressState {
  switch (action.type) {
    case 'SET_PROGRESS':
      return { ...state, progress: action.progress };

    case 'ADVANCE_EPISODE': {
      const existing = state.progress.find((p) => p.showId === action.showId);
      if (existing) {
        return {
          ...state,
          progress: state.progress.map((p) =>
            p.showId === action.showId
              ? { ...p, season: action.season, episode: action.episode, watchedAt: new Date().toISOString() }
              : p,
          ),
        };
      }
      return {
        ...state,
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
        ...state,
        progress: state.progress.filter((p) => p.showId !== action.showId),
      };

    case 'RESET_ALL':
      return { progress: [], episodeCounts: {} };

    case 'SET_EPISODE_COUNT':
      return {
        ...state,
        episodeCounts: { ...state.episodeCounts, [action.showId]: action.count },
      };

    case 'SET_EPISODE_COUNTS':
      return {
        ...state,
        episodeCounts: { ...state.episodeCounts, ...action.counts },
      };

    default:
      return state;
  }
}

// --- Persistence ---

function loadFromStorage(): ProgressState {
  if (typeof localStorage === 'undefined') return { progress: [], episodeCounts: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { progress: [], episodeCounts: {} };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { progress: parsed, episodeCounts: {} };
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.progress)) {
      return {
        progress: parsed.progress,
        episodeCounts: parsed.episodeCounts ?? {},
      };
    }
    return { progress: [], episodeCounts: {} };
  } catch {
    return { progress: [], episodeCounts: {} };
  }
}

function saveToStorage(state: ProgressState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ progress: state.progress, episodeCounts: state.episodeCounts }));
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
      update((state) => ({ ...state, progress }));
    },
    getProgress(showId: number): EpisodeProgress | undefined {
      const state = get({ subscribe });
      return state.progress.find((p) => p.showId === showId);
    },
    setEpisodeCount(showId: number, count: number) {
      update((state) => ({
        ...state,
        episodeCounts: { ...state.episodeCounts, [showId]: count },
      }));
    },
    setEpisodeCounts(counts: Record<number, number>) {
      update((state) => ({
        ...state,
        episodeCounts: { ...state.episodeCounts, ...counts },
      }));
    },
    getEpisodeCount(showId: number): number | undefined {
      const state = get({ subscribe });
      return state.episodeCounts[showId];
    },
    reset() {
      set({ progress: [], episodeCounts: {} });
    },
  };
}

export const progressStore = createStore();

// --- Derived values ---

export const progress = derived(progressStore, ($store) => $store.progress);
export const episodeCounts = derived(progressStore, ($store) => $store.episodeCounts);
export const progressCount = derived(progress, ($progress) => $progress.length);
