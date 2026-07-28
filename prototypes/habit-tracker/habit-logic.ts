/**
 * PROTOTYPE — Habit Tracker Logic
 *
 * Question being answered: Does the streak calculation and state model
 * handle edge cases correctly? What does the state look like after
 * various sequences of actions?
 *
 * This is a pure module — no I/O, no console.log, no terminal code.
 * The TUI shell imports it and calls into it.
 */

export interface Habit {
  id: string;
  name: string;
  createdAt: string; // ISO date YYYY-MM-DD
  completions: Record<string, boolean>; // keys are YYYY-MM-DD
}

export type HabitAction =
  | { type: 'ADD_HABIT'; name: string }
  | { type: 'REMOVE_HABIT'; id: string }
  | { type: 'TOGGLE_COMPLETION'; id: string; date: string }
  | { type: 'RENAME_HABIT'; id: string; name: string };

export interface HabitState {
  habits: Habit[];
  today: string; // YYYY-MM-DD — mockable for testing
}

function genId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

/**
 * Calculate the streak for a habit.
 * A streak is consecutive completed days ending today or yesterday.
 */
export function calculateStreak(completions: Record<string, boolean>, today: string): number {
  let streak = 0;
  let checkDate = today;

  // If today isn't completed, start from yesterday (streak in progress)
  if (!completions[today]) {
    checkDate = addDays(today, -1);
  }

  while (completions[checkDate]) {
    streak++;
    checkDate = addDays(checkDate, -1);
  }

  return streak;
}

/**
 * Get the completion status for a given date.
 */
export function isCompleted(completions: Record<string, boolean>, date: string): boolean {
  return completions[date] === true;
}

/**
 * Get the last 7 days ending on today.
 */
export function getWeekDates(today: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(today, -(6 - i)));
}

/**
 * Count completions in the last 7 days.
 */
export function weeklyCompletions(completions: Record<string, boolean>, today: string): number {
  return getWeekDates(today).filter((d) => completions[d]).length;
}

/**
 * Get the most recent completion date (for updatedAt).
 */
export function lastUpdated(habits: Habit[]): string | null {
  let latest: string | null = null;
  for (const habit of habits) {
    for (const date of Object.keys(habit.completions)) {
      if (habit.completions[date] && (!latest || date > latest)) {
        latest = date;
      }
    }
  }
  return latest;
}

/**
 * Pure reducer — the heart of the state model.
 */
export function habitReducer(state: HabitState, action: HabitAction): HabitState {
  switch (action.type) {
    case 'ADD_HABIT': {
      if (!action.name.trim()) return state;
      const newHabit: Habit = {
        id: genId(),
        name: action.name.trim(),
        createdAt: state.today,
        completions: {},
      };
      return { ...state, habits: [...state.habits, newHabit] };
    }

    case 'REMOVE_HABIT':
      return {
        ...state,
        habits: state.habits.filter((h) => h.id !== action.id),
      };

    case 'TOGGLE_COMPLETION': {
      return {
        ...state,
        habits: state.habits.map((h) => {
          if (h.id !== action.id) return h;
          const current = h.completions[action.date] === true;
          return {
            ...h,
            completions: {
              ...h.completions,
              [action.date]: !current,
            },
          };
        }),
      };
    }

    case 'RENAME_HABIT': {
      if (!action.name.trim()) return state;
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === action.id ? { ...h, name: action.name.trim() } : h,
        ),
      };
    }

    default:
      return state;
  }
}
