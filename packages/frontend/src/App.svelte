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
  import HabitWidget from '$widgets/habits/HabitWidget.svelte';
  import { Toaster } from 'svelte-french-toast';
  import { layoutStore, layout } from '$lib/layout-store';
  import { cn } from '$lib/utils';
  import { dndzone } from 'svelte-dnd-action';
  import { GripVertical } from 'lucide-svelte';

  const COMPONENTS: Record<string, any> = {
    weather: WeatherWidget,
    news: NewsWidget,
    agenda: AgendaWidget,
    games: GamesWidget,
    habits: HabitWidget,
  };

  let items = $derived(
    $layout.order.map((id) => ({ id, component: COMPONENTS[id] })),
  );

  let flipDurationMs = 200;

  function handleDndConsider(e: CustomEvent) {
    items = e.detail.items;
  }

  function handleDndFinalize(e: CustomEvent) {
    items = e.detail.items;
    layoutStore.reorder(items.map((item) => item.id));
  }

  onMount(() => {
    themeStore.init();
  });

  function getSize(id: string): 'compact' | 'wide' {
    return $layout.widgets[id]?.size ?? 'compact';
  }

  function toggleSize(id: string) {
    layoutStore.toggleSize(id);
  }
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

    <main
      class="grid grid-cols-1 gap-4 lg:grid-cols-2"
      use:dndzone={{ items, flipDurationMs, type: 'dashboard' }}
      onconsider={handleDndConsider}
      onfinalize={handleDndFinalize}
    >
      {#each items as item (item.id)}
        <div class={cn(getSize(item.id) === 'wide' && 'lg:col-span-2')}>
          <item.component
            size={getSize(item.id)}
            onToggleSize={() => toggleSize(item.id)}
          >
            {#snippet dragHandle()}
              <GripVertical class="h-4 w-4" />
            {/snippet}
          </item.component>
        </div>
      {/each}
    </main>
  </div>
</QueryClientProvider>
