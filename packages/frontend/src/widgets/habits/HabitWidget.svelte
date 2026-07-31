<script lang="ts">
  import { CheckCircle, Plus, X } from 'lucide-svelte';
  import WidgetCard from '../../components/WidgetCard.svelte';
  import {
    habitStore,
    habits,
    habitCount,
    calculateStreak,
    weeklyCompletions,
    getWeekDates,
    formatDate,
  } from '$lib/habit-store';


  let {
    isDragging = false,
    isResizing = false,
    onDragStart,
    onResizeStart,
  }: {
    isDragging?: boolean;
    isResizing?: boolean;
    onDragStart?: (e: PointerEvent) => void;
    onResizeStart?: (e: PointerEvent, edge: 'right' | 'bottom' | 'corner') => void;
  } = $props();

  const today = $derived(formatDate(new Date()));
  const completedToday = $derived($habits.filter((h) => h.completions[today]).length);

  let showAddInput = $state(false);
  let newHabitName = $state('');

  const isAdding = $derived(showAddInput);
  const total = $derived($habitCount);
  const done = $derived(completedToday);
  const allDone = $derived(total > 0 && done === total);

  function handleRefresh() {
    // Habits are local — nothing to refresh from server
  }

  function handleAdd() {
    if (newHabitName.trim()) {
      habitStore.dispatch({ type: 'ADD_HABIT', name: newHabitName });
      newHabitName = '';
      showAddInput = false;
    }
  }

  function handleRemove(id: string) {
    habitStore.dispatch({ type: 'REMOVE_HABIT', id });
  }

  function handleToggle(id: string) {
    habitStore.dispatch({ type: 'TOGGLE_COMPLETION', id, date: today });
  }
</script>

<WidgetCard
  title="Habits"
  isLoading={false}
  isFetching={false}
  error=""
  onRefresh={handleRefresh}
  updatedAt={undefined}
  {isDragging}
  {isResizing}
  {onDragStart}
  {onResizeStart}
>
  {#snippet icon()}
    <CheckCircle class="h-4 w-4" />
  {/snippet}
  {#snippet children()}
    {#if total === 0 && !isAdding}
      <p class="py-4 text-center text-sm text-neutral-400">No habits yet. Add one to get started.</p>
    {:else}
      <div class="flex flex-col gap-2">
        {#each $habits as habit (habit.id)}
          {@const streak = calculateStreak(habit.completions, today)}
          {@const week = weeklyCompletions(habit.completions, today)}
          {@const weekDates = getWeekDates(today)}
          {@const doneToday = habit.completions[today] === true}
          <div class="flex items-center gap-2 rounded-lg border border-neutral-100 p-2 dark:border-neutral-800">
            <button
              onclick={() => handleToggle(habit.id)}
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors
                {doneToday
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-neutral-300 dark:border-neutral-600 hover:border-green-400'}"
            >
              {#if doneToday}
                <CheckCircle class="h-3 w-3" />
              {/if}
            </button>

            <span class="min-w-0 flex-1 text-sm {doneToday ? 'text-neutral-400 line-through' : ''}">
              {habit.name}
            </span>

            {#if streak > 0}
              <span class="shrink-0 rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                {streak}d
              </span>
            {/if}

            <div class="flex shrink-0 gap-0.5">
              {#each weekDates as date}
                {@const completed = habit.completions[date] === true}
                <div
                  class="h-2 w-2 rounded-full {completed ? 'bg-green-500' : 'bg-neutral-200 dark:bg-neutral-700'}"
                  title={date}
                ></div>
              {/each}
            </div>

            <button
              onclick={() => handleRemove(habit.id)}
              class="shrink-0 rounded p-0.5 text-neutral-300 transition-colors hover:text-red-400 dark:text-neutral-600"
              title="Remove habit"
            >
              <X class="h-3 w-3" />
            </button>
          </div>
        {/each}
      </div>
    {/if}

    {#if isAdding}
      <div class="mt-2 flex gap-2">
        <input
          bind:value={newHabitName}
          onkeydown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { showAddInput = false; newHabitName = ''; } }}
          placeholder="Habit name..."
          class="flex-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
        />
        <button
          onclick={handleAdd}
          class="rounded-md bg-green-500 px-2 py-1 text-xs text-white transition-colors hover:bg-green-600"
        >
          Add
        </button>
        <button
          onclick={() => { showAddInput = false; newHabitName = ''; }}
          class="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-500 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Cancel
        </button>
      </div>
    {:else}
      <button
        onclick={() => (showAddInput = true)}
        class="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-neutral-200 py-1.5 text-xs text-neutral-400 transition-colors hover:border-neutral-300 hover:text-neutral-500 dark:border-neutral-700 dark:hover:border-neutral-600"
      >
        <Plus class="h-3 w-3" />
        Add habit
      </button>
    {/if}

    {#if total > 0}
      <div class="mt-3 flex items-center justify-between text-xs text-neutral-400">
        <span>{done}/{total} completed today</span>
        {#if allDone}
          <span class="text-green-500">All done!</span>
        {/if}
      </div>
      <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        <div
          class="h-full rounded-full bg-green-500 transition-all duration-300"
          style="width: {total > 0 ? (done / total) * 100 : 0}%"
        ></div>
      </div>
    {/if}
  {/snippet}
</WidgetCard>
