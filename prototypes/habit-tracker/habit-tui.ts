/**
 * PROTOTYPE — Habit Tracker TUI
 *
 * Interactive terminal app that drives the habit tracker state model.
 * Run: npx tsx prototypes/habit-tracker/habit-tui.ts
 *
 * Controls:
 *   [a] Add habit       [d] Remove habit     [r] Rename habit
 *   [1-9] Toggle today  [j] Toggle yesterday [k] Toggle 2 days ago
 *   [+] Advance day     [-] Retreat day       [q] Quit
 */

import {
  type HabitState,
  habitReducer,
  calculateStreak,
  isCompleted,
  getWeekDates,
  weeklyCompletions,
  formatDate,
  addDays,
} from './habit-logic.js';

import * as readline from 'readline';

const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

function getState(): HabitState {
  return {
    habits: [],
    today: formatDate(new Date()),
  };
}

function render(state: HabitState) {
  console.clear();

  console.log(`${BOLD}=== Habit Tracker Prototype ===${RESET}`);
  console.log(`${DIM}Today: ${state.today}${RESET}`);
  console.log();

  if (state.habits.length === 0) {
    console.log(`${DIM}  No habits yet. Press [a] to add one.${RESET}`);
  } else {
    console.log(
      `${BOLD}  ${'#'.padEnd(3)} ${'Habit'.padEnd(20)} ${'Today'.padEnd(8)} ${'Streak'.padEnd(8)} ${'Week'.padEnd(6)}${RESET}`,
    );
    console.log(`  ${'─'.repeat(55)}`);

    state.habits.forEach((habit, i) => {
      const num = String(i + 1);
      const todayDone = isCompleted(habit.completions, state.today);
      const streak = calculateStreak(habit.completions, state.today);
      const week = weeklyCompletions(habit.completions, state.today);

      const todayMark = todayDone ? `${GREEN}✓${RESET}` : `${DIM}○${RESET}`;
      const streakStr =
        streak > 0 ? `${YELLOW}${streak}d${RESET}` : `${DIM}0d${RESET}`;
      const weekBar = `${GREEN}${'█'.repeat(week)}${DIM}${'░'.repeat(7 - week)}${RESET}`;

      console.log(`  ${DIM}${num}.${RESET} ${habit.name.padEnd(20)} ${todayMark.padEnd(10)} ${streakStr.padEnd(10)} ${weekBar}`);
    });
  }

  console.log();

  // Show completions for context
  if (state.habits.length > 0) {
    console.log(`${BOLD}  History:${RESET}`);
    const dates = [addDays(state.today, -2), addDays(state.today, -1), state.today];
    dates.forEach((date) => {
      const label = date === state.today ? 'Today ' : date === addDays(state.today, -1) ? 'Yest. ' : addDays(state.today, -2);
      const marks = state.habits
        .map((h) => (isCompleted(h.completions, date) ? `${GREEN}✓${RESET}` : `${DIM}○${RESET}`))
        .join(' ');
      console.log(`  ${DIM}${label}:${RESET} ${marks}`);
    });
  }

  console.log();
  console.log(`${BOLD}  Controls:${RESET}`);
  console.log(`  ${BOLD}[a]${RESET}${DIM} add habit${RESET}  ${BOLD}[d]${RESET}${DIM} remove${RESET}  ${BOLD}[r]${RESET}${DIM} rename${RESET}  ${BOLD}[1-9]${RESET}${DIM} toggle today${RESET}`);
  console.log(`  ${BOLD}[j]${RESET}${DIM} toggle yesterday${RESET}  ${BOLD}[k]${RESET}${DIM} toggle 2d ago${RESET}  ${BOLD}[+]${RESET}${DIM} advance day${RESET}  ${BOLD}[-]${RESET}${DIM} retreat day${RESET}`);
  console.log(`  ${BOLD}[q]${RESET}${DIM} quit${RESET}`);
}

async function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let state = getState();

  render(state);

  for await (const line of rl) {
    const input = line.trim().toLowerCase();

    if (input === 'q') break;

    if (input === 'a') {
      const name = await prompt(rl, '  Habit name: ');
      state = habitReducer(state, { type: 'ADD_HABIT', name });
    } else if (input === 'd') {
      const idx = await prompt(rl, '  Habit # to remove: ');
      const i = parseInt(idx) - 1;
      if (i >= 0 && i < state.habits.length) {
        state = habitReducer(state, { type: 'REMOVE_HABIT', id: state.habits[i].id });
      }
    } else if (input === 'r') {
      const idx = await prompt(rl, '  Habit # to rename: ');
      const i = parseInt(idx) - 1;
      if (i >= 0 && i < state.habits.length) {
        const name = await prompt(rl, '  New name: ');
        state = habitReducer(state, { type: 'RENAME_HABIT', id: state.habits[i].id, name });
      }
    } else if (/^[1-9]$/.test(input)) {
      const i = parseInt(input) - 1;
      if (i >= 0 && i < state.habits.length) {
        state = habitReducer(state, {
          type: 'TOGGLE_COMPLETION',
          id: state.habits[i].id,
          date: state.today,
        });
      }
    } else if (input === 'j') {
      // Toggle yesterday for habit #1 (quick action)
      if (state.habits.length > 0) {
        const idx = await prompt(rl, '  Habit # to toggle yesterday: ');
        const i = parseInt(idx) - 1;
        if (i >= 0 && i < state.habits.length) {
          state = habitReducer(state, {
            type: 'TOGGLE_COMPLETION',
            id: state.habits[i].id,
            date: addDays(state.today, -1),
          });
        }
      }
    } else if (input === 'k') {
      // Toggle 2 days ago for habit #1
      if (state.habits.length > 0) {
        const idx = await prompt(rl, '  Habit # to toggle 2d ago: ');
        const i = parseInt(idx) - 1;
        if (i >= 0 && i < state.habits.length) {
          state = habitReducer(state, {
            type: 'TOGGLE_COMPLETION',
            id: state.habits[i].id,
            date: addDays(state.today, -2),
          });
        }
      }
    } else if (input === '+') {
      state = { ...state, today: addDays(state.today, 1) };
    } else if (input === '-') {
      state = { ...state, today: addDays(state.today, -1) };
    }

    render(state);
  }

  rl.close();
  process.exit(0);
}

main();
