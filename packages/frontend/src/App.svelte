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
  import { weatherIcon } from '$lib/weather-store';
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

  let resizeId: string | null = $state(null);
  let resizeEdge: 'right' | 'bottom' | 'corner' = $state('right');
  let resizeStartX = $state(0);
  let resizeStartY = $state(0);
  let resizeOrigColSpan = $state(0);
  let resizeOrigRowSpan = $state(0);
  let resizePreviewColSpan = $state(0);
  let resizePreviewRowSpan = $state(0);

  type GradientColors = { light: [string, string]; dark: [string, string] };

  const GRADIENT_FLAT: Record<string, GradientColors> = {
    'morning-clear': { light: ['#fef3c7', '#fde68a'], dark: ['#451a03', '#78350f'] },
    'morning-cloudy': { light: ['#e5e7eb', '#d1d5db'], dark: ['#1f2937', '#374151'] },
    'morning-precip': { light: ['#dbeafe', '#bfdbfe'], dark: ['#1e3a5f', '#1e40af'] },
    'afternoon-clear': { light: ['#fef9c3', '#fde047'], dark: ['#713f12', '#854d0e'] },
    'afternoon-cloudy': { light: ['#f3f4f6', '#e5e7eb'], dark: ['#111827', '#1f2937'] },
    'afternoon-precip': { light: ['#e0e7ff', '#c7d2fe'], dark: ['#1e1b4b', '#312e81'] },
    'evening-clear': { light: ['#fed7aa', '#fb923c'], dark: ['#7c2d12', '#9a3412'] },
    'evening-cloudy': { light: ['#ddd6fe', '#c4b5fd'], dark: ['#2e1065', '#4c1d95'] },
    'evening-precip': { light: ['#fecdd3', '#fda4af'], dark: ['#881337', '#9f1239'] },
    'night-clear': { light: ['#1e293b', '#0f172a'], dark: ['#020617', '#0f172a'] },
    'night-cloudy': { light: ['#374151', '#1f2937'], dark: ['#111827', '#030712'] },
    'night-precip': { light: ['#312e81', '#1e1b4b'], dark: ['#0c0a1d', '#070520'] },
  };

  const WEATHER_BUCKETS: Record<string, string> = {
    sun: 'clear',
    'cloud-sun': 'clear',
    cloud: 'cloudy',
    fog: 'cloudy',
    drizzle: 'cloudy',
    rain: 'precip',
    'cloud-rain': 'precip',
    snow: 'precip',
    bolt: 'precip',
  };

  function getTimePeriod(): string {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  function getWeatherBucket(icon: string): string {
    return WEATHER_BUCKETS[icon] ?? 'cloudy';
  }

  function applyGradient() {
    const period = getTimePeriod();
    const bucket = getWeatherBucket($weatherIcon);
    const isDark = themeStore.current === 'dark';
    const key = `${period}-${bucket}`;
    const palette: GradientColors = GRADIENT_FLAT[key] ?? GRADIENT_FLAT['morning-cloudy']!;
    const colors = isDark ? palette.dark : palette.light;

    document.documentElement.style.setProperty('--bg-from', colors[0]);
    document.documentElement.style.setProperty('--bg-to', colors[1]);
  }

  $effect(() => {
    $weatherIcon;
    themeStore.current;
    applyGradient();
  });

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
    e.preventDefault();
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

  function handleResizeStart(e: PointerEvent, id: string, edge: 'right' | 'bottom' | 'corner') {
    e.preventDefault();
    const pos = $layout.widgets[id];
    if (!pos || !gridEl) return;

    e.stopPropagation();
    resizeId = id;
    resizeEdge = edge;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeOrigColSpan = pos.colSpan;
    resizeOrigRowSpan = pos.rowSpan;
    resizePreviewColSpan = pos.colSpan;
    resizePreviewRowSpan = pos.rowSpan;
    gridWidth = gridEl.getBoundingClientRect().width;

    document.addEventListener('pointermove', handleResizeMove);
    document.addEventListener('pointerup', handleResizeEnd);
    document.addEventListener('keydown', handleResizeKeyDown);
  }

  function handleResizeMove(e: PointerEvent) {
    if (!resizeId || !gridEl) return;

    const colWidth = gridWidth / GRID_COLS;
    const dx = e.clientX - resizeStartX;
    const dy = e.clientY - resizeStartY;

    let newColSpan = resizeOrigColSpan;
    let newRowSpan = resizeOrigRowSpan;

    if (resizeEdge === 'right' || resizeEdge === 'corner') {
      newColSpan = Math.max(2, resizeOrigColSpan + Math.round(dx / colWidth));
    }
    if (resizeEdge === 'bottom' || resizeEdge === 'corner') {
      newRowSpan = Math.max(2, resizeOrigRowSpan + Math.round(dy / ROW_HEIGHT));
    }

    const pos = $layout.widgets[resizeId];
    if (!pos) return;

    const candidate = { col: pos.col, row: pos.row, colSpan: newColSpan, rowSpan: newRowSpan };
    const otherWidgets = Object.entries($layout.widgets)
      .filter(([id]) => id !== resizeId)
      .map(([, w]) => w);

    if (!otherWidgets.some((w) => {
      return (
        candidate.col < w.col + w.colSpan &&
        candidate.col + candidate.colSpan > w.col &&
        candidate.row < w.row + w.rowSpan &&
        candidate.row + candidate.rowSpan > w.row
      );
    })) {
      resizePreviewColSpan = newColSpan;
      resizePreviewRowSpan = newRowSpan;
    }
  }

  function handleResizeEnd() {
    if (!resizeId) return;

    layoutStore.updatePosition(resizeId, {
      col: $layout.widgets[resizeId]?.col ?? 0,
      row: $layout.widgets[resizeId]?.row ?? 0,
      colSpan: resizePreviewColSpan,
      rowSpan: resizePreviewRowSpan,
    });

    resizeId = null;
    document.removeEventListener('pointermove', handleResizeMove);
    document.removeEventListener('pointerup', handleResizeEnd);
    document.removeEventListener('keydown', handleResizeKeyDown);
  }

  function handleResizeKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && resizeId) {
      resizeId = null;
      document.removeEventListener('pointermove', handleResizeMove);
      document.removeEventListener('pointerup', handleResizeEnd);
      document.removeEventListener('keydown', handleResizeKeyDown);
    }
  }

  function startResize(id: string) {
    return (e: PointerEvent, edge: 'right' | 'bottom' | 'corner') => handleResizeStart(e, id, edge);
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
      style={breakpoint === 'desktop' ? 'grid-template-columns: repeat(6, 1fr); grid-auto-rows: 120px;' : 'grid-auto-rows: 120px;'}
    >
      {#each $layout.order as id (id)}
        {@const pos = responsivePositions[id]}
        {@const WidgetComponent = COMPONENTS[id]}
        {#if pos && WidgetComponent}
          <div
            class="h-full"
            style={breakpoint === 'desktop'
              ? `grid-column: ${pos.col + 1} / span ${pos.colSpan}; grid-row: ${pos.row + 1} / span ${pos.rowSpan};`
              : ''}
          >
            <WidgetComponent
              isDragging={dragId === id}
              isResizing={resizeId === id}
              onDragStart={dragId ? undefined : startDrag(id)}
              onResizeStart={resizeId ? undefined : startResize(id)}
            />
          </div>
        {/if}
      {/each}

      {#if dragId}
        {@const pos = $layout.widgets[dragId]}
        {@const DragComponent = COMPONENTS[dragId]}
        {#if pos && DragComponent}
          <div
            class="pointer-events-none absolute z-50 opacity-70"
            style="
              grid-column: {ghostCol + 1} / span {ghostColSpan};
              grid-row: {ghostRow + 1} / span {ghostRowSpan};
              width: 100%;
            "
          >
            <DragComponent />
          </div>
        {/if}
      {/if}

      {#if resizeId}
        {@const pos = $layout.widgets[resizeId]}
        {#if pos}
          <div
            class="pointer-events-none absolute z-50 rounded-xl border-2 border-blue-400 opacity-50"
            style="
              grid-column: {pos.col + 1} / span {resizePreviewColSpan};
              grid-row: {pos.row + 1} / span {resizePreviewRowSpan};
              width: 100%;
            "
          ></div>
        {/if}
      {/if}
    </main>
  </div>
</QueryClientProvider>
