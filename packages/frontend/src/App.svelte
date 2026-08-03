<script lang="ts">
  import { onMount } from 'svelte';
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import { queryClient } from '$lib/query-client';
  import { themeStore } from '$lib/theme.svelte';
  import ThemeToggle from '$components/ThemeToggle.svelte';
  import { Toaster } from 'svelte-french-toast';
  import { layoutStore, layout } from '$lib/layout-store';
  import { initSync } from '$lib/sync-service';
  import { weatherIcon } from '$lib/weather-store';
  import { createDragController } from '$lib/drag-controller.svelte';
  import { createResizeController } from '$lib/resize-controller.svelte';
  import { applyGradient } from '$lib/gradient-theme';
  import { computeResponsivePositions } from '$lib/responsive-layout';
  import { COMPONENTS } from '$lib/widget-registry';
  import WidgetLayout from '$components/WidgetLayout.svelte';

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

  $effect(() => {
    applyGradient($weatherIcon, themeStore.current);
  });

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
