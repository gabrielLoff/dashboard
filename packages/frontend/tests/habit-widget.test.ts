import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HabitWidget from '../src/widgets/habits/HabitWidget.svelte';
import { habitStore } from '../src/lib/habit-store';

beforeEach(() => {
  habitStore.reset();
});

describe('HabitWidget', () => {
  it('shows empty state when no habits', () => {
    render(HabitWidget);
    expect(screen.getByText(/No habits yet/)).toBeInTheDocument();
  });

  it('shows add habit button', () => {
    render(HabitWidget);
    expect(screen.getByText(/Add habit/)).toBeInTheDocument();
  });

  it('renders habits from store', () => {
    habitStore.dispatch({ type: 'ADD_HABIT', name: 'Exercise' });
    habitStore.dispatch({ type: 'ADD_HABIT', name: 'Read' });

    render(HabitWidget);
    expect(screen.getByText('Exercise')).toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('shows completion count', () => {
    habitStore.dispatch({ type: 'ADD_HABIT', name: 'Exercise' });
    habitStore.dispatch({ type: 'ADD_HABIT', name: 'Read' });

    render(HabitWidget);
    expect(screen.getByText(/0\/2 completed today/)).toBeInTheDocument();
  });

  it('shows progress bar when habits exist', () => {
    habitStore.dispatch({ type: 'ADD_HABIT', name: 'Exercise' });
    const { container } = render(HabitWidget);
    const progressBar = container.querySelector('.bg-green-500');
    expect(progressBar).toBeInTheDocument();
  });

  it('toggles habit completion', async () => {
    habitStore.dispatch({ type: 'ADD_HABIT', name: 'Exercise' });

    const { container } = render(HabitWidget);

    // Click the toggle button (first button with the checkbox class)
    const toggleButtons = container.querySelectorAll('button');
    const toggleButton = Array.from(toggleButtons).find((btn) =>
      btn.className.includes('rounded border'),
    );

    if (toggleButton) {
      await toggleButton.click();
    }

    // Check that the store was updated
    const state = habitStore;
    let currentState: any;
    const unsub = state.subscribe((s) => (currentState = s));
    unsub();

    expect(currentState.habits[0].completions[getCurrentDate()]).toBe(true);
  });

  it('shows streak badge when streak > 0', () => {
    habitStore.dispatch({ type: 'ADD_HABIT', name: 'Exercise' });
    habitStore.dispatch({ type: 'TOGGLE_COMPLETION', id: getHabitId(), date: getCurrentDate() });

    render(HabitWidget);
    expect(screen.getByText(/1d/)).toBeInTheDocument();
  });
});

function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getHabitId(): string {
  let currentState: any;
  const unsub = habitStore.subscribe((s) => (currentState = s));
  unsub();
  return currentState.habits[0]?.id ?? '';
}
