import { writable, derived } from 'svelte/store';

const STORAGE_KEY = 'dashboard-habits';

// --- Pure functions (portable, testable) ---

export function formatDate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return formatDate(d);
}

export function calculateStreak(completions: Record<string, boolean>, today: string): number {
  let streak = 0;
  let checkDate = today;

  if (!completions[today]) {
    checkDate = addDays(today, -1);
  }

  while (completions[checkDate]) {
    streak++;
    checkDate = addDays(checkDate, -1);
  }

  return streak;
}

export function getWeekDates(today: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(today, -(6 - i)));
}

export function weeklyCompletions(completions: Record<string, boolean>, today: string): number {
  return getWeekDates(today).filter((d) => completions[d]).length;
}

export function lastUpdatedDate(habits: Habit[]): string | null {
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

// --- Types ---

export interface Habit {
  id: string;
  name: string;
  createdAt: string;
  completions: Record<string, boolean>;
}

export type HabitAction =
  | { type: 'ADD_HABIT'; name: string }
  | { type: 'REMOVE_HABIT'; id: string }
  | { type: 'TOGGLE_COMPLETION'; id: string; date: string }
  | { type: 'RENAME_HABIT'; id: string; name: string };

export interface HabitState {
  habits: Habit[];
}

function genId(): string {
  return Math.random().toString(36).slice(2, 9);
}

// --- Reducer ---

export function habitReducer(state: HabitState, action: HabitAction): HabitState {
  switch (action.type) {
    case 'ADD_HABIT': {
      if (!action.name.trim()) return state;
      return {
        ...state,
        habits: [
          ...state.habits,
          {
            id: genId(),
            name: action.name.trim(),
            createdAt: formatDate(new Date()),
            completions: {},
          },
        ],
      };
    }

    case 'REMOVE_HABIT':
      return {
        ...state,
        habits: state.habits.filter((h) => h.id !== action.id),
      };

    case 'TOGGLE_COMPLETION':
      return {
        ...state,
        habits: state.habits.map((h) => {
          if (h.id !== action.id) return h;
          return {
            ...h,
            completions: {
              ...h.completions,
              [action.date]: !h.completions[action.date],
            },
          };
        }),
      };

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

// --- Persistence ---

function loadFromStorage(): HabitState {
  if (typeof localStorage === 'undefined') return { habits: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { habits: [] };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { habits: parsed };
    return { habits: [] };
  } catch {
    return { habits: [] };
  }
}

function saveToStorage(state: HabitState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.habits));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

// --- Store ---

function createStore() {
  const initial = loadFromStorage();
  const { subscribe, update, set } = writable<HabitState>(initial);

  // Persist on every mutation
  subscribe((state) => {
    saveToStorage(state);
  });

  return {
    subscribe,
    dispatch(action: HabitAction) {
      update((state) => habitReducer(state, action));
    },
    setHabits(habits: Habit[]) {
      set({ habits });
    },
    reset() {
      set({ habits: [] });
    },
  };
}

export const habitStore = createStore();

// --- Derived values ---

export const habits = derived(habitStore, ($store) => $store.habits);

export const habitCount = derived(habits, ($habits) => $habits.length);

export const updatedAt = derived(habits, ($habits) => lastUpdatedDate($habits));
