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
  import { initSync } from '$lib/sync-service';
  import { snapToGrid, findNearestFreePosition, computeMobileOrder, GRID_COLS, ROW_HEIGHT } from '$lib/grid-engine';
  import type { WidgetLayout } from '$lib/layout-store';

  const COMPONENTS: Record<string, any> = {
    weather: WeatherWidget,
    news: NewsWidget,
    agenda: AgendaWidget,
    games: GamesWidget,
    shows: ShowsWidget,
    habits: HabitWidget,
  };

  let gridEl: HTMLElement;
  let dragId: string | null = $state(null);
  let ghostCol = $state(0);
  let ghostRow = $state(0);
  let ghostColSpan = $state(0);
  let ghostRowSpan = $state(0);
  let offsetX = $state(0);
  let offsetY = $state(0);
  let gridWidth = $state(0);
  let breakpoint: 'mobile' | 'tablet' | 'desktop' = $state('desktop');

  function computeResponsivePositions(
    widgets: Record<string, WidgetLayout>,
    order: string[],
    bp: 'mobile' | 'tablet' | 'desktop',
  ): Record<string, { col: number; row: number; colSpan: number; rowSpan: number }> {
    if (bp === 'desktop') {
      const result: Record<string, { col: number; row: number; colSpan: number; rowSpan: number }> = {};
      for (const id of order) {
        const w = widgets[id];
        if (w) result[id] = { col: w.col, row: w.row, colSpan: w.colSpan, rowSpan: w.rowSpan };
      }
      return result;
    }

    if (bp === 'mobile') {
      const sorted = computeMobileOrder(widgets, order);
      const result: Record<string, { col: number; row: number; colSpan: number; rowSpan: number }> = {};
      let row = 0;
      for (const id of sorted) {
        result[id] = { col: 0, row, colSpan: 1, rowSpan: 1 };
        row += 1;
      }
      return result;
    }

    const tabletOrder = computeMobileOrder(widgets, order);
    const result: Record<string, { col: number; row: number; colSpan: number; rowSpan: number }> = {};
    let row = 0;
    let col = 0;
    for (const id of tabletOrder) {
      const w = widgets[id];
      const span = w ? Math.min(w.colSpan, 2) : 1;
      if (col + span > 2) {
        row += 1;
        col = 0;
      }
      result[id] = { col, row, colSpan: span, rowSpan: 1 };
      col += span;
    }
    return result;
  }

  let responsivePositions = $derived(
    computeResponsivePositions($layout.widgets, $layout.order, breakpoint),
  );

  function handlePointerDown(e: PointerEvent, id: string) {
    const pos = $layout.widgets[id];
    if (!pos || !gridEl) return;

    const rect = gridEl.getBoundingClientRect();
    const colWidth = rect.width / GRID_COLS;

    dragId = id;
    ghostCol = pos.col;
    ghostRow = pos.row;
    ghostColSpan = pos.colSpan;
    ghostRowSpan = pos.rowSpan;
    gridWidth = rect.width;
    offsetX = e.clientX - rect.left - pos.col * colWidth;
    offsetY = e.clientY - rect.top - pos.row * ROW_HEIGHT;

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('keydown', handleKeyDown);
  }

  function handlePointerMove(e: PointerEvent) {
    if (!dragId || !gridEl) return;

    const rect = gridEl.getBoundingClientRect();
    const colWidth = gridWidth / GRID_COLS;
    const rawCol = (e.clientX - rect.left - offsetX) / colWidth;
    const rawRow = (e.clientY - rect.top - offsetY) / ROW_HEIGHT;

    const snapped = snapToGrid(rawCol, rawRow, ghostColSpan, ghostRowSpan);

    const otherWidgets = Object.entries($layout.widgets)
      .filter(([id]) => id !== dragId)
      .map(([, w]) => w);

    const nearest = findNearestFreePosition(snapped, otherWidgets);
    ghostCol = nearest.col;
    ghostRow = nearest.row;
  }

  function handlePointerUp() {
    if (!dragId) return;

    layoutStore.updatePosition(dragId, {
      col: ghostCol,
      row: ghostRow,
      colSpan: ghostColSpan,
      rowSpan: ghostRowSpan,
    });

    dragId = null;
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    document.removeEventListener('keydown', handleKeyDown);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && dragId) {
      dragId = null;
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('keydown', handleKeyDown);
    }
  }

  function startDrag(id: string) {
    return (e: PointerEvent) => handlePointerDown(e, id);
  }

  onMount(() => {
    themeStore.init();
    initSync();

    const mqlMobile = window.matchMedia('(max-width: 639px)');
    const mqlTablet = window.matchMedia('(min-width: 640px) and (max-width: 1023px)');

    function updateBreakpoint() {
      if (mqlMobile.matches) breakpoint = 'mobile';
      else if (mqlTablet.matches) breakpoint = 'tablet';
      else breakpoint = 'desktop';
    }

    updateBreakpoint();
    mqlMobile.addEventListener('change', updateBreakpoint);
    mqlTablet.addEventListener('change', updateBreakpoint);

    return () => {
      mqlMobile.removeEventListener('change', updateBreakpoint);
      mqlTablet.removeEventListener('change', updateBreakpoint);
    };
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

    <main
      bind:this={gridEl}
      class="relative grid gap-3"
      class:grid-cols-1={breakpoint === 'mobile'}
      class:grid-cols-2={breakpoint === 'tablet'}
      style={breakpoint === 'desktop' ? 'grid-template-columns: repeat(6, 1fr); grid-auto-rows: 60px;' : 'grid-auto-rows: 60px;'}
    >
      {#each $layout.order as id (id)}
        {@const pos = responsivePositions[id]}
        {#if pos && COMPONENTS[id]}
          <div
            style={breakpoint === 'desktop'
              ? `grid-column: ${pos.col + 1} / span ${pos.colSpan}; grid-row: ${pos.row + 1} / span ${pos.rowSpan};`
              : ''}
          >
            <svelte:component
              this={COMPONENTS[id]}
              isDragging={dragId === id}
              onDragStart={dragId ? undefined : startDrag(id)}
            />
          </div>
        {/if}
      {/each}

      {#if dragId}
        {@const pos = $layout.widgets[dragId]}
        {#if pos}
          <div
            class="pointer-events-none absolute z-50 opacity-70"
            style="
              grid-column: {ghostCol + 1} / span {ghostColSpan};
              grid-row: {ghostRow + 1} / span {ghostRowSpan};
              width: 100%;
            "
          >
            <svelte:component this={COMPONENTS[dragId]} />
          </div>
        {/if}
      {/if}
    </main>
  </div>
</QueryClientProvider>
