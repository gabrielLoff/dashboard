<script lang="ts">
  import { onMount } from 'svelte';
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import { queryClient } from '$lib/query-client';
  import { themeStore } from '$lib/theme.svelte';
  import ThemeToggle from '$components/ThemeToggle.svelte';
  import { Toaster } from 'svelte-french-toast';
  import { initSync } from '$lib/sync-service';
  import { createHabitSyncAdapter, createShowSyncAdapter, createLayoutSyncAdapter, createProgressSyncAdapter } from '$lib/store-sync-adapters';
  import { weatherIcon } from '$lib/weather-store';
  import { applyGradient } from '$lib/gradient-theme';
  import { getBreakpoint, type Breakpoint } from '$lib/responsive-layout';
  import { COMPONENTS, CAROUSEL_ITEMS, LEFT_WIDGET_IDS } from '$lib/widget-registry';
  import Carousel from '$components/Carousel.svelte';

  let breakpoint: Breakpoint = $state('desktop');

  $effect(() => {
    applyGradient($weatherIcon, themeStore.current);
  });

  onMount(() => {
    themeStore.init();
    initSync([
      createHabitSyncAdapter(),
      createShowSyncAdapter(),
      createLayoutSyncAdapter(),
      createProgressSyncAdapter(),
    ]);

    breakpoint = getBreakpoint();

    const mqlMobile = window.matchMedia('(max-width: 639px)');
    const mqlTablet = window.matchMedia('(min-width: 640px) and (max-width: 1023px)');

    function updateBreakpoint() {
      breakpoint = getBreakpoint();
    }

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

    {#if breakpoint === 'desktop'}
      <main class="flex h-[calc(100vh-10rem)] gap-3">
        <div class="flex h-full w-[40%] flex-col gap-3">
          {#each LEFT_WIDGET_IDS as id (id)}
            {@const WidgetComponent = COMPONENTS[id]}
            {#if WidgetComponent}
              <div class="min-h-0 flex-1">
                <WidgetComponent />
              </div>
            {/if}
          {/each}
        </div>

        <div class="flex h-full w-[60%] flex-col">
          <Carousel items={CAROUSEL_ITEMS}>
            {#snippet children(id: string)}
              {@const WidgetComponent = COMPONENTS[id]}
              {#if WidgetComponent}
                <WidgetComponent />
              {/if}
            {/snippet}
          </Carousel>
        </div>
      </main>
    {:else}
      <main class="flex flex-col gap-3">
        {#each LEFT_WIDGET_IDS as id (id)}
          {@const WidgetComponent = COMPONENTS[id]}
          {#if WidgetComponent}
            <WidgetComponent />
          {/if}
        {/each}

        <Carousel items={CAROUSEL_ITEMS}>
          {#snippet children(id: string)}
            {@const WidgetComponent = COMPONENTS[id]}
            {#if WidgetComponent}
              <WidgetComponent />
            {/if}
          {/snippet}
        </Carousel>
      </main>
    {/if}
  </div>
</QueryClientProvider>
