import { habitStore, type Habit } from './habit-store';
import { showStore, type WatchlistEntry } from './show-store';
import { layoutStore } from './layout-store';
import { progressStore } from './progress-store';
import type { EpisodeProgress } from '@dashboard/shared';

export interface SyncData {
  habits: Habit[];
  watchlist: WatchlistEntry[];
  layout: { carouselOrder: string[] };
  progress: EpisodeProgress[];
}

export interface StoreSyncAdapter<T> {
  hydrate(data: SyncData): void;
  push(data: T): Promise<void>;
  subscribe(onChange: (data: T) => void): () => void;
}

const BASE = '/api';

async function pushHabits(habits: Habit[]): Promise<void> {
  const res = await fetch(`${BASE}/sync/habits`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ habits }),
  });
  if (!res.ok) throw new Error(`pushHabits failed: ${res.status}`);
}

async function pushWatchlist(entries: WatchlistEntry[]): Promise<void> {
  const res = await fetch(`${BASE}/sync/watchlist`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries }),
  });
  if (!res.ok) throw new Error(`pushWatchlist failed: ${res.status}`);
}

async function pushLayout(carouselOrder: string[]): Promise<void> {
  const res = await fetch(`${BASE}/sync/layout`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ carouselOrder }),
  });
  if (!res.ok) throw new Error(`pushLayout failed: ${res.status}`);
}

export function createHabitSyncAdapter(): StoreSyncAdapter<Habit[]> {
  return {
    hydrate(data) {
      habitStore.setHabits(data.habits);
    },
    push: pushHabits,
    subscribe(onChange) {
      return habitStore.subscribe((state) => {
        onChange(state.habits);
      });
    },
  };
}

export function createShowSyncAdapter(): StoreSyncAdapter<WatchlistEntry[]> {
  return {
    hydrate(data) {
      showStore.reset();
      for (const entry of data.watchlist) {
        showStore.addShow(entry.id, entry.name, entry.image);
      }
    },
    push: pushWatchlist,
    subscribe(onChange) {
      return showStore.subscribe((state) => {
        onChange(state.entries);
      });
    },
  };
}

export function createLayoutSyncAdapter(): StoreSyncAdapter<string[]> {
  return {
    hydrate(data) {
      layoutStore.reset();
      layoutStore.reorder(data.layout.carouselOrder);
    },
    push: pushLayout,
    subscribe(onChange) {
      return layoutStore.subscribe((state) => {
        onChange(state.carouselOrder);
      });
    },
  };
}

async function pushProgress(progress: EpisodeProgress[]): Promise<void> {
  const res = await fetch(`${BASE}/sync/progress`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ progress }),
  });
  if (!res.ok) throw new Error(`pushProgress failed: ${res.status}`);
}

export function createProgressSyncAdapter(): StoreSyncAdapter<EpisodeProgress[]> {
  return {
    hydrate(data) {
      if (data.progress.length > 0) {
        progressStore.setProgress(data.progress);
      }
    },
    push: pushProgress,
    subscribe(onChange) {
      return progressStore.subscribe((state) => {
        onChange(state.progress);
      });
    },
  };
}
