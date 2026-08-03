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
  import WidgetLayout from '$components/WidgetLayout.svelte';
  import { Toaster } from 'svelte-french-toast';
  import { layoutStore, layout } from '$lib/layout-store';
  import { initSync } from '$lib/sync-service';
  import { weatherIcon } from '$lib/weather-store';
  import { computeMobileOrder } from '$lib/grid-engine';
  import { createDragController } from '$lib/drag-controller.svelte';
  import { createResizeController } from '$lib/resize-controller.svelte';
  import type { WidgetLayout as WidgetLayoutData } from '$lib/layout-store';

  const COMPONENTS: Record<string, any> = {
    weather: WeatherWidget,
    news: NewsWidget,
    agenda: AgendaWidget,
    games: GamesWidget,
    shows: ShowsWidget,
    habits: HabitWidget,
  };

  let gridEl: HTMLElement;
  let breakpoint: 'mobile' | 'tablet' | 'desktop' = $state('desktop');

  const drag = createDragController({ getWidgets: () => $layout.widgets }, () => gridEl);
  let dragId = $derived(drag.state.dragId);
  let ghostCol = $derived(drag.state.ghostCol);
  let ghostRow = $derived(drag.state.ghostRow);
  let ghostColSpan = $derived(drag.state.ghostColSpan);
  let ghostRowSpan = $derived(drag.state.ghostRowSpan);

  const resizeCtrl = createResizeController({
    getWidgets: () => $layout.widgets,
    gridWidthGetter: () => gridEl?.getBoundingClientRect().width ?? 0,
    updatePosition: (widgetId, position) => layoutStore.updatePosition(widgetId, position),
  });

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
    widgets: Record<string, WidgetLayoutData>,
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
            <WidgetLayout
              isDragging={dragId === id}
              isResizing={resizeCtrl.state.resizeId === id}
              onDragStart={dragId ? undefined : drag.startDrag(id)}
              onResizeStart={resizeCtrl.state.resizeId ? undefined : resizeCtrl.startResize(id)}
            >
              <WidgetComponent />
            </WidgetLayout>
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

      {#if resizeCtrl.state.resizeId}
        {@const pos = $layout.widgets[resizeCtrl.state.resizeId]}
        {#if pos}
          <div
            class="pointer-events-none absolute z-50 rounded-xl border-2 border-blue-400 opacity-50"
            style="
              grid-column: {pos.col + 1} / span {resizeCtrl.state.resizePreviewColSpan};
              grid-row: {pos.row + 1} / span {resizeCtrl.state.resizePreviewRowSpan};
              width: 100%;
            "
          ></div>
        {/if}
      {/if}
    </main>
  </div>
</QueryClientProvider>
