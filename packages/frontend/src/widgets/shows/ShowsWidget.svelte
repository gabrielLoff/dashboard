<script lang="ts">
  import { Tv, Plus, X, Check, Search, Loader2 } from 'lucide-svelte';
  import WidgetCard from '../../components/WidgetCard.svelte';
  import { manifest } from './manifest';
  import { createWidgetQuery, createWidgetRefresh } from '$lib/widget-query';
  import { isOk, isUpcomingEpisode, type UpcomingEntry, type ShowSearchResult } from '@dashboard/shared';
  import type { ApiResult, ShowsData } from '@dashboard/shared';
  import { searchShows } from '$lib/api-client';
  import { showStore, watchlistIds } from '$lib/show-store';


  let {} = $props();

  let showModal = $state(false);
  let searchInput = $state('');
  let searchResults = $state<ShowSearchResult[]>([]);
  let isSearching = $state(false);
  let debounceTimer = $state<ReturnType<typeof setTimeout>>();

  const query = $derived(createWidgetQuery(manifest, $watchlistIds));
  const data = $derived<ApiResult<ShowsData> | undefined>($query.data);
  const error = $derived($query.data && !isOk($query.data) ? $query.data.error : '');
  const upcoming = $derived<UpcomingEntry[]>(data && isOk(data) ? data.data.upcoming : []);
  const updatedAt = $derived(data && isOk(data) ? data.data.updatedAt : undefined);

  const handleRefresh = createWidgetRefresh(manifest, () => $query.refetch(), () => [$watchlistIds]);

  function handleSearchInput(value: string) {
    searchInput = value;
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!value.trim()) {
      searchResults = [];
      isSearching = false;
      return;
    }
    isSearching = true;
    debounceTimer = setTimeout(async () => {
      const result = await searchShows(value.trim());
      if (isOk(result)) {
        searchResults = result.data;
      } else {
        searchResults = [];
      }
      isSearching = false;
    }, 300);
  }

  function addShow(show: ShowSearchResult) {
    showStore.addShow(show.id, show.name, show.image?.medium);
    showModal = false;
    searchInput = '';
    searchResults = [];
  }

  function removeShow(id: number) {
    showStore.removeShow(id);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      showModal = false;
    }
  }

  function formatEntry(entry: UpcomingEntry): string {
    if (isUpcomingEpisode(entry)) {
      return `S${entry.season}E${entry.number} ${entry.title} — ${entry.airdate}`;
    }
    if (entry.premiereDate) {
      return `Season ${entry.season} coming ${entry.premiereDate}`;
    }
    return `Season ${entry.season} coming (date TBA)`;
  }
</script>

<WidgetCard
  title="My Shows"
  query={$query}
  error={error}
  onRefresh={handleRefresh}
  updatedAt={updatedAt}
>
  {#snippet icon()}
    <Tv class="h-4 w-4" />
  {/snippet}
  {#snippet children()}
    <div class="flex flex-col gap-2">
      {#each upcoming as entry (entry.showId + '-' + (isUpcomingEpisode(entry) ? `s${entry.season}e${entry.number}` : `s${entry.season}`))}
        <div class="flex items-center gap-2 rounded-lg border border-neutral-100 p-2 dark:border-neutral-800">
          <span class="min-w-0 flex-1 text-sm">{entry.showName}</span>
          <span class="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">{formatEntry(entry)}</span>
          <button
            onclick={() => removeShow(entry.showId)}
            class="shrink-0 rounded p-0.5 text-neutral-300 transition-colors hover:text-red-400 dark:text-neutral-600"
            title="Remove show"
          >
            <X class="h-3 w-3" />
          </button>
        </div>
      {/each}
      {#if upcoming.length === 0 && $watchlistIds.length === 0}
        <p class="py-4 text-center text-sm text-neutral-400">No shows tracked yet. Click + to add one.</p>
      {:else if upcoming.length === 0}
        <p class="py-4 text-center text-sm text-neutral-400">No upcoming episodes</p>
      {/if}
    </div>

    <button
      onclick={() => (showModal = true)}
      class="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-neutral-200 py-1.5 text-xs text-neutral-400 transition-colors hover:border-neutral-300 hover:text-neutral-500 dark:border-neutral-700 dark:hover:border-neutral-600"
    >
      <Plus class="h-3 w-3" />
      Add show
    </button>
  {/snippet}
</WidgetCard>

{#if showModal}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    onclick={() => (showModal = false)}
    onkeydown={handleKeydown}
  >
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="mx-4 w-full max-w-md rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
      onclick={(e) => e.stopPropagation()}
      onkeydown={handleKeydown}
    >
      <div class="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
        <h3 class="text-sm font-semibold">Add Show</h3>
        <button
          onclick={() => (showModal = false)}
          class="rounded p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <div class="p-4">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchInput}
            oninput={(e) => handleSearchInput(e.currentTarget.value)}
            placeholder="Search for a show..."
            class="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>

        <div class="mt-3 max-h-80 overflow-y-auto">
          {#if isSearching}
            <div class="flex items-center justify-center py-4">
              <Loader2 class="h-5 w-5 animate-spin text-neutral-400" />
            </div>
          {:else if searchResults.length > 0}
            <div class="flex flex-col gap-1">
              {#each searchResults as show (show.id)}
                {@const isTracked = $watchlistIds.includes(show.id)}
                <button
                  onclick={() => !isTracked && addShow(show)}
                  disabled={isTracked}
                  class="flex items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-neutral-50 disabled:opacity-60 dark:hover:bg-neutral-800"
                >
                  {#if show.image}
                    <img src={show.image.medium} alt="" class="h-10 w-7 shrink-0 rounded object-cover" />
                  {:else}
                    <div class="h-10 w-7 shrink-0 rounded bg-neutral-200 dark:bg-neutral-700"></div>
                  {/if}
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium">{show.name}</p>
                    <p class="truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {show.network?.name ?? show.webChannel?.name ?? 'Unknown'} · {show.status}
                    </p>
                  </div>
                  {#if isTracked}
                    <Check class="h-4 w-4 shrink-0 text-green-500" />
                  {/if}
                </button>
              {/each}
            </div>
          {:else if searchInput.trim()}
            <p class="py-4 text-center text-sm text-neutral-400">No results found</p>
          {:else}
            <p class="py-4 text-center text-sm text-neutral-400">Type to search for shows</p>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
