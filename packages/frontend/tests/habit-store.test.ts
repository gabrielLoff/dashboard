import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  habitReducer,
  calculateStreak,
  addDays,
  formatDate,
  getWeekDates,
  weeklyCompletions,
  lastUpdatedDate,
  type HabitState,
} from '../src/lib/habit-store';

function makeState(habits: HabitState['habits'] = []): HabitState {
  return { habits };
}

describe('habitReducer', () => {
  it('adds a habit', () => {
    const state = habitReducer(makeState(), { type: 'ADD_HABIT', name: 'Exercise' });
    expect(state.habits).toHaveLength(1);
    expect(state.habits[0].name).toBe('Exercise');
    expect(state.habits[0].completions).toEqual({});
  });

  it('trims whitespace from habit name', () => {
    const state = habitReducer(makeState(), { type: 'ADD_HABIT', name: '  Read  ' });
    expect(state.habits[0].name).toBe('Read');
  });

  it('rejects empty habit name', () => {
    const state = habitReducer(makeState(), { type: 'ADD_HABIT', name: '   ' });
    expect(state.habits).toHaveLength(0);
  });

  it('removes a habit', () => {
    const initial = makeState([{ id: '1', name: 'Test', createdAt: '2026-07-28', completions: {} }]);
    const state = habitReducer(initial, { type: 'REMOVE_HABIT', id: '1' });
    expect(state.habits).toHaveLength(0);
  });

  it('toggles completion on', () => {
    const initial = makeState([{ id: '1', name: 'Test', createdAt: '2026-07-28', completions: {} }]);
    const state = habitReducer(initial, { type: 'TOGGLE_COMPLETION', id: '1', date: '2026-07-28' });
    expect(state.habits[0].completions['2026-07-28']).toBe(true);
  });

  it('toggles completion off', () => {
    const initial = makeState([
      { id: '1', name: 'Test', createdAt: '2026-07-28', completions: { '2026-07-28': true } },
    ]);
    const state = habitReducer(initial, { type: 'TOGGLE_COMPLETION', id: '1', date: '2026-07-28' });
    expect(state.habits[0].completions['2026-07-28']).toBe(false);
  });

  it('renames a habit', () => {
    const initial = makeState([{ id: '1', name: 'Old', createdAt: '2026-07-28', completions: {} }]);
    const state = habitReducer(initial, { type: 'RENAME_HABIT', id: '1', name: 'New' });
    expect(state.habits[0].name).toBe('New');
  });

  it('rejects empty rename', () => {
    const initial = makeState([{ id: '1', name: 'Old', createdAt: '2026-07-28', completions: {} }]);
    const state = habitReducer(initial, { type: 'RENAME_HABIT', id: '1', name: '   ' });
    expect(state.habits[0].name).toBe('Old');
  });
});

describe('calculateStreak', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 for no completions', () => {
    expect(calculateStreak({}, '2026-07-28')).toBe(0);
  });

  it('returns 1 for today only', () => {
    expect(calculateStreak({ '2026-07-28': true }, '2026-07-28')).toBe(1);
  });

  it('returns 2 for today + yesterday', () => {
    expect(calculateStreak({ '2026-07-28': true, '2026-07-27': true }, '2026-07-28')).toBe(2);
  });

  it('counts streak in progress when today is missing but yesterday is done', () => {
    expect(calculateStreak({ '2026-07-27': true }, '2026-07-28')).toBe(1);
  });

  it('breaks streak at a gap', () => {
    const completions = {
      '2026-07-28': true,
      '2026-07-27': true,
      '2026-07-26': false,
      '2026-07-25': true,
    };
    expect(calculateStreak(completions, '2026-07-28')).toBe(2);
  });

  it('handles long streaks', () => {
    const completions: Record<string, boolean> = {};
    for (let i = 0; i < 30; i++) {
      completions[addDays('2026-07-28', -i)] = true;
    }
    expect(calculateStreak(completions, '2026-07-28')).toBe(30);
  });
});

describe('getWeekDates', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 7 dates ending on today', () => {
    const dates = getWeekDates('2026-07-28');
    expect(dates).toHaveLength(7);
    expect(dates[6]).toBe('2026-07-28');
    expect(dates[0]).toBe('2026-07-22');
  });
});

describe('weeklyCompletions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts completions in last 7 days', () => {
    const completions = {
      '2026-07-28': true,
      '2026-07-26': true,
      '2026-07-22': true,
    };
    expect(weeklyCompletions(completions, '2026-07-28')).toBe(3);
  });

  it('ignores completions older than 7 days', () => {
    const completions = { '2026-07-20': true };
    expect(weeklyCompletions(completions, '2026-07-28')).toBe(0);
  });
});

describe('lastUpdatedDate', () => {
  it('returns null for empty habits', () => {
    expect(lastUpdatedDate([])).toBeNull();
  });

  it('returns most recent completion date', () => {
    const habits = [
      { id: '1', name: 'A', createdAt: '2026-07-28', completions: { '2026-07-25': true } },
      { id: '2', name: 'B', createdAt: '2026-07-28', completions: { '2026-07-28': true, '2026-07-20': true } },
    ];
    expect(lastUpdatedDate(habits)).toBe('2026-07-28');
  });
});
