<script lang="ts">
  import { Gamepad2, Clock, ExternalLink, Loader2 } from 'lucide-svelte';
  import WidgetCard from '../../components/WidgetCard.svelte';
  import { manifest } from './manifest';
  import { createWidgetQuery, createWidgetRefresh } from '$lib/widget-query';
  import { isOk, type FreeGame, type GamesFilters } from '@dashboard/shared';
  import type { ApiResult, FreeGamesData } from '@dashboard/shared';
  import { fetchGames } from '$lib/api-client';


  let {} = $props();

  let typeFilter = $state<string>('all');
  let platformFilter = $state<string>('pc');
  let currentPage = $state<number>(1);
  let allGames = $state<FreeGame[]>([]);
  let isLoadingMore = $state<boolean>(false);
  let hasMore = $state<boolean>(true);

  const filters = $derived<GamesFilters>({
    type: typeFilter === 'all' ? undefined : typeFilter as GamesFilters['type'],
    platform: platformFilter as GamesFilters['platform'],
  });
  const query = $derived(createWidgetQuery(manifest, { ...filters, page: 1 }));
  const data = $derived<ApiResult<FreeGamesData> | undefined>($query.data);
  const error = $derived($query.data && !isOk($query.data) ? $query.data.error : '');
  const totalResults = $derived(data && isOk(data) ? data.data.totalResults : 0);
  const updatedAt = $derived(data && isOk(data) ? data.data.updatedAt : undefined);

  $effect(() => {
    if (data && isOk(data)) {
      allGames = data.data.games;
      currentPage = 1;
      hasMore = data.data.games.length < totalResults;
    }
  });

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'game', label: 'Game' },
    { value: 'loot', label: 'Loot' },
    { value: 'beta', label: 'Beta' },
  ];

  const platformOptions = [
    { value: 'pc', label: 'PC' },
    { value: 'steam', label: 'Steam' },
    { value: 'epic-games-store', label: 'Epic' },
    { value: 'gog', label: 'GOG' },
    { value: 'drm-free', label: 'DRM-Free' },
    { value: 'itchio', label: 'itch.io' },
  ];

  async function loadMore() {
    if (isLoadingMore || !hasMore) return;
    isLoadingMore = true;
    try {
      const nextPage = currentPage + 1;
      const result = await fetchGames({ ...filters, page: nextPage });
      if (isOk(result)) {
        allGames = [...allGames, ...result.data.games];
        currentPage = nextPage;
        hasMore = allGames.length < totalResults;
      }
    } finally {
      isLoadingMore = false;
    }
  }

  function handleScroll(e: Event) {
    const target = e.target as HTMLElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMore();
    }
  }

  const handleRefresh = createWidgetRefresh(manifest, () => $query.refetch(), () => [filters]);

  function daysUntil(dateStr: string): string {
    if (!dateStr) return '';
    const now = new Date();
    const then = new Date(dateStr);
    const diff = Math.ceil((then.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (isNaN(diff)) return '';
    if (diff <= 0) return 'Expired';
    if (diff === 1) return '1 day left';
    return `${diff} days left`;
  }
</script>

<WidgetCard
  title="Free Games"
  query={$query}
  error={error}
  onRefresh={handleRefresh}
  updatedAt={updatedAt}
>
  {#snippet icon()}
    <Gamepad2 class="h-4 w-4" />
  {/snippet}
  {#snippet children()}
    <div class="mb-3 flex gap-2">
      <select
        bind:value={typeFilter}
        class="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
      >
        {#each typeOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
      <select
        bind:value={platformFilter}
        class="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
      >
        {#each platformOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>
    <div class="max-h-96 overflow-y-auto" onscroll={handleScroll}>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {#each allGames as game (game.id)}
          <a
            href={game.url}
            target="_blank"
            rel="noopener noreferrer"
            class="group overflow-hidden rounded-lg border border-neutral-100 transition-colors hover:border-primary-200 dark:border-neutral-800 dark:hover:border-primary-800"
          >
            <img src={game.imageUrl} alt={game.title} class="h-24 w-full object-cover" />
            <div class="p-3">
              <div class="flex items-start justify-between gap-1">
                <p class="text-sm font-medium group-hover:text-primary-600">{game.title}</p>
                <ExternalLink class="mt-0.5 h-3 w-3 shrink-0 text-neutral-300" />
              </div>
              <div class="mt-2 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span>{game.platform} - {game.source}</span>
                <span class="flex items-center gap-1"><Clock class="h-3 w-3" /> {daysUntil(game.expiryDate)}</span>
              </div>
            </div>
          </a>
        {/each}
      </div>
      {#if hasMore}
        <div class="mt-3 flex justify-center">
          <button
            onclick={loadMore}
            disabled={isLoadingMore}
            class="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            {#if isLoadingMore}
              <Loader2 class="h-3 w-3 animate-spin" />
              Loading...
            {:else}
              Load more
            {/if}
          </button>
        </div>
      {/if}
    </div>
    <p class="mt-3 text-center text-xs text-neutral-400">
      Powered by
      <a href="https://www.gamerpower.com" target="_blank" rel="noopener noreferrer" class="underline hover:text-neutral-500">
        GamerPower
      </a>
    </p>
  {/snippet}
</WidgetCard>
