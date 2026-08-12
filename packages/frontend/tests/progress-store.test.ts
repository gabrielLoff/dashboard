import { describe, it, expect, beforeEach } from 'vitest';
import { progressReducer, type ProgressState, type ProgressAction } from '../src/lib/progress-store';
import type { EpisodeProgress } from '@dashboard/shared';

const initialState: ProgressState = { progress: [] };

const sampleProgress: EpisodeProgress[] = [
  { showId: 46562, showName: 'The Last of Us', season: 3, episode: 5, watchedAt: '2026-07-28T12:00:00.000Z' },
  { showId: 690, showName: 'Stranger Things', season: 4, episode: 9, watchedAt: '2026-07-28T10:00:00.000Z' },
];

describe('progressReducer', () => {
  describe('SET_PROGRESS', () => {
    it('replaces progress with provided data', () => {
      const action: ProgressAction = { type: 'SET_PROGRESS', progress: sampleProgress };
      const result = progressReducer(initialState, action);
      expect(result.progress).toEqual(sampleProgress);
    });

    it('clears progress when setting empty array', () => {
      const state: ProgressState = { progress: sampleProgress };
      const action: ProgressAction = { type: 'SET_PROGRESS', progress: [] };
      const result = progressReducer(state, action);
      expect(result.progress).toEqual([]);
    });
  });

  describe('ADVANCE_EPISODE', () => {
    it('adds new show progress', () => {
      const action: ProgressAction = {
        type: 'ADVANCE_EPISODE',
        showId: 46562,
        showName: 'The Last of Us',
        season: 3,
        episode: 5,
      };
      const result = progressReducer(initialState, action);

      expect(result.progress).toHaveLength(1);
      expect(result.progress[0].showId).toBe(46562);
      expect(result.progress[0].showName).toBe('The Last of Us');
      expect(result.progress[0].season).toBe(3);
      expect(result.progress[0].episode).toBe(5);
      expect(result.progress[0].watchedAt).toBeDefined();
    });

    it('updates existing show progress', () => {
      const state: ProgressState = { progress: sampleProgress };
      const action: ProgressAction = {
        type: 'ADVANCE_EPISODE',
        showId: 46562,
        showName: 'The Last of Us',
        season: 3,
        episode: 6,
      };
      const result = progressReducer(state, action);

      expect(result.progress).toHaveLength(2);
      const updated = result.progress.find((p) => p.showId === 46562);
      expect(updated?.season).toBe(3);
      expect(updated?.episode).toBe(6);
    });

    it('preserves other shows when updating', () => {
      const state: ProgressState = { progress: sampleProgress };
      const action: ProgressAction = {
        type: 'ADVANCE_EPISODE',
        showId: 46562,
        showName: 'The Last of Us',
        season: 3,
        episode: 6,
      };
      const result = progressReducer(state, action);

      const other = result.progress.find((p) => p.showId === 690);
      expect(other?.season).toBe(4);
      expect(other?.episode).toBe(9);
    });
  });

  describe('RESET_SHOW', () => {
    it('removes progress for specified show', () => {
      const state: ProgressState = { progress: sampleProgress };
      const action: ProgressAction = { type: 'RESET_SHOW', showId: 46562 };
      const result = progressReducer(state, action);

      expect(result.progress).toHaveLength(1);
      expect(result.progress[0].showId).toBe(690);
    });

    it('handles non-existent show gracefully', () => {
      const state: ProgressState = { progress: sampleProgress };
      const action: ProgressAction = { type: 'RESET_SHOW', showId: 999 };
      const result = progressReducer(state, action);

      expect(result.progress).toHaveLength(2);
    });
  });

  describe('RESET_ALL', () => {
    it('clears all progress', () => {
      const state: ProgressState = { progress: sampleProgress };
      const action: ProgressAction = { type: 'RESET_ALL' };
      const result = progressReducer(state, action);

      expect(result.progress).toEqual([]);
    });

    it('handles empty state gracefully', () => {
      const action: ProgressAction = { type: 'RESET_ALL' };
      const result = progressReducer(initialState, action);
      expect(result.progress).toEqual([]);
    });
  });

  describe('default case', () => {
    it('returns state unchanged for unknown action', () => {
      const state: ProgressState = { progress: sampleProgress };
      const action = { type: 'UNKNOWN' } as ProgressAction;
      const result = progressReducer(state, action);
      expect(result).toBe(state);
    });
  });
});
