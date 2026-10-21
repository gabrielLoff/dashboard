import { request, type SyncData, type Habit, type WatchlistEntry, type EpisodeProgress } from '@dashboard/shared';
import { habitStore } from './habit-store';
import { showStore } from './show-store';
import { progressStore } from './progress-store';

export type { SyncData, Habit, WatchlistEntry };

export interface StoreSyncAdapter<T> {
  hydrate(data: SyncData): void;
  push(data: T): Promise<void>;
  subscribe(onChange: (data: T) => void): () => void;
}

export function createHabitSyncAdapter(): StoreSyncAdapter<Habit[]> {
  return {
    hydrate(data) {
      if (data.habits.length > 0) {
        habitStore.setHabits(data.habits);
      }
    },
    async push(habits) {
      const result = await request('PUT /api/sync/habits', { habits });
      if (!result.ok) throw new Error(result.error);
    },
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
      if (data.watchlist.length > 0) {
        showStore.reset();
        for (const entry of data.watchlist) {
          showStore.addShow(entry.id, entry.name, entry.image);
        }
      }
    },
    async push(entries) {
      const result = await request('PUT /api/sync/watchlist', { entries });
      if (!result.ok) throw new Error(result.error);
    },
    subscribe(onChange) {
      return showStore.subscribe((state) => {
        onChange(state.entries);
      });
    },
  };
}

export function createProgressSyncAdapter(): StoreSyncAdapter<EpisodeProgress[]> {
  return {
    hydrate(data) {
      if (data.progress.length > 0) {
        progressStore.setProgress(data.progress);
      }
    },
    async push(progress) {
      const result = await request('PUT /api/sync/progress', { progress });
      if (!result.ok) throw new Error(result.error);
    },
    subscribe(onChange) {
      return progressStore.subscribe((state) => {
        onChange(state.progress);
      });
    },
  };
}
