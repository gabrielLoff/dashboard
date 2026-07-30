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
  import { layoutStore, layout } from '$lib/layout-store';
  import { GripVertical } from 'lucide-svelte';
  import { initSync } from '$lib/sync-service';
  import Masonry from 'svelte-bricks';
  import { segmentItems } from '$lib/segment-items';

  const COMPONENTS: Record<string, any> = {
    weather: WeatherWidget,
    news: NewsWidget,
    agenda: AgendaWidget,
    games: GamesWidget,
    shows: ShowsWidget,
    habits: HabitWidget,
  };

  interface AppItem {
    id: string;
    component: any;
  }

  let allItems = $derived(
    $layout.order.map((id): AppItem => ({ id, component: COMPONENTS[id] })),
  );

  let widgetSizes = $derived(
    Object.fromEntries(
      Object.entries($layout.widgets).map(([id, w]) => [id, w.size])
    ),
  );

  let segments = $derived(segmentItems(allItems, widgetSizes));

  let draggedId: string | null = $state(null);
  let dragOverId: string | null = $state(null);

  function handleDragStart(e: DragEvent, id: string) {
    draggedId = id;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
    }
  }

  function handleDragOver(e: DragEvent, id: string) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    if (dragOverId !== id) {
      dragOverId = id;
    }
  }

  function handleDragLeave() {
    dragOverId = null;
  }

  function handleDrop(e: DragEvent, targetId: string) {
    e.preventDefault();
    dragOverId = null;
    if (!draggedId || draggedId === targetId) return;

    const currentOrder = layoutStore.getOrder();
    const from = currentOrder.indexOf(draggedId);
    const to = currentOrder.indexOf(targetId);
    const newOrder = [...currentOrder];
    newOrder.splice(from, 1);
    newOrder.splice(to, 0, draggedId);
    layoutStore.reorder(newOrder);
    draggedId = null;
  }

  function handleDragEnd() {
    draggedId = null;
    dragOverId = null;
  }

  onMount(() => {
    themeStore.init();
    initSync();
  });

  function toggleSize(id: string) {
    layoutStore.toggleSize(id);
  }

  function segmentKey(segment: { type: string; items: { id: string }[] }): string {
    if (segment.type === 'wide') return `wide-${segment.items[0]?.id}`;
    return `masonry-${segment.items.map((i) => i.id).join('-')}`;
  }

  function findItem(id: string): AppItem | undefined {
    return allItems.find((item) => item.id === id);
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

    <main class="flex flex-col gap-4">
      {#each segments as segment (segmentKey(segment))}
        {#if segment.type === 'wide'}
          {@const item = findItem(segment.items[0].id)}
          {#if item}
            <div
              class="drag-item"
              class:dragging={draggedId === item.id}
              class:drag-over={dragOverId === item.id}
              role="listitem"
              draggable="true"
              ondragstart={(e) => handleDragStart(e, item.id)}
              ondragover={(e) => handleDragOver(e, item.id)}
              ondragleave={handleDragLeave}
              ondrop={(e) => handleDrop(e, item.id)}
              ondragend={handleDragEnd}
            >
              <item.component
                size="wide"
                onToggleSize={() => toggleSize(item.id)}
              >
                {#snippet dragHandle()}
                  <GripVertical class="h-4 w-4" />
                {/snippet}
              </item.component>
            </div>
          {/if}
        {:else}
          <Masonry
            items={segment.items}
            minColWidth={300}
            maxColWidth={500}
            gap={16}
            getId={(item) => item.id}
          >
            {#snippet children({ item: masonryItem })}
              {@const appItem = findItem(masonryItem.id)}
              {#if appItem}
                <div
                  class="drag-item"
                  class:dragging={draggedId === appItem.id}
                  class:drag-over={dragOverId === appItem.id}
                  role="listitem"
                  draggable="true"
                  ondragstart={(e) => handleDragStart(e, appItem.id)}
                  ondragover={(e) => handleDragOver(e, appItem.id)}
                  ondragleave={handleDragLeave}
                  ondrop={(e) => handleDrop(e, appItem.id)}
                  ondragend={handleDragEnd}
                >
                  <appItem.component
                    size="compact"
                    onToggleSize={() => toggleSize(appItem.id)}
                  >
                    {#snippet dragHandle()}
                      <GripVertical class="h-4 w-4" />
                    {/snippet}
                  </appItem.component>
                </div>
              {/if}
            {/snippet}
          </Masonry>
        {/if}
      {/each}
    </main>
  </div>
</QueryClientProvider>

<style>
  .drag-item {
    transition: outline 150ms ease, opacity 150ms ease;
    outline: 2px solid transparent;
    outline-offset: 2px;
  }

  .drag-item.drag-over {
    outline: 2px dashed oklch(0.6 0.15 250);
  }

  .drag-item.dragging {
    opacity: 0.5;
  }
</style>
