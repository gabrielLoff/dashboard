<script lang="ts">
  import { onMount } from 'svelte';
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import { queryClient } from '$lib/query-client';
  import { themeStore } from '$lib/theme.svelte';
  import ThemeToggle from '$components/ThemeToggle.svelte';
  import WeatherWidget from '$widgets/weather/WeatherWidget.svelte';
  import NewsWidget from '$widgets/news/NewsWidget.svelte';
  import AgendaWidget from '$widgets/agenda/AgendaWidget.svelte';
  import GamesWidget from '$widgets/games/GamesWidget.svelte';
  import ShowsWidget from '$widgets/shows/ShowsWidget.svelte';
  import HabitWidget from '$widgets/habits/HabitWidget.svelte';
  import { Toaster } from 'svelte-french-toast';
  import { layout } from '$lib/layout-store';
  import { initSync } from '$lib/sync-service';

  const COMPONENTS: Record<string, any> = {
    weather: WeatherWidget,
    news: NewsWidget,
    agenda: AgendaWidget,
    games: GamesWidget,
    shows: ShowsWidget,
    habits: HabitWidget,
  };

  onMount(() => {
    themeStore.init();
    initSync();
  });
</script>

<QueryClientProvider client={queryClient}>
  <Toaster />
  <div class="mx-auto min-h-screen max-w-7xl px-4 py-6">
    <header class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">Your daily overview</p>
      </div>
      <ThemeToggle />
    </header>

    <main class="grid gap-3" style="grid-template-columns: repeat(6, 1fr); grid-auto-rows: 60px;">
      {#each $layout.order as id (id)}
        {@const pos = $layout.widgets[id]}
        {#if pos && COMPONENTS[id]}
          <div
            style="grid-column: {pos.col + 1} / span {pos.colSpan}; grid-row: {pos.row + 1} / span {pos.rowSpan};"
          >
            <svelte:component this={COMPONENTS[id]} size="compact" />
          </div>
        {/if}
      {/each}
    </main>
  </div>
</QueryClientProvider>
