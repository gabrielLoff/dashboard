<script lang="ts">
  import { X, Loader2, Check } from 'lucide-svelte';
  import { fetchEpisodes } from '$lib/api-client';
  import { isOk, type EpisodeProgress, type EpisodeListEntry } from '@dashboard/shared';

  let {
    showId,
    showName,
    currentProgress,
    onAdvance,
    onReset,
    onClose,
  }: {
    showId: number;
    showName: string;
    currentProgress: EpisodeProgress | undefined;
    onAdvance: (showId: number, showName: string, season: number, episode: number) => void;
    onReset: (showId: number) => void;
    onClose: () => void;
  } = $props();

  let episodes = $state<EpisodeListEntry[]>([]);
  let isLoading = $state(true);
  let error = $state('');
  let activeSeason = $state(1);

  const seasons = $derived(() => {
    const s = new Set(episodes.map((ep) => ep.season));
    return Array.from(s).sort((a, b) => a - b);
  });

  const episodesForSeason = $derived(() => {
    return episodes.filter((ep) => ep.season === activeSeason);
  });

  const currentSeason = $derived(currentProgress?.season ?? 0);
  const currentEpisode = $derived(currentProgress?.episode ?? 0);

  function isWatched(ep: EpisodeListEntry): boolean {
    if (ep.season < currentSeason) return true;
    if (ep.season === currentSeason && ep.number <= currentEpisode) return true;
    return false;
  }

  function handleEpisodeClick(ep: EpisodeListEntry) {
    if (isWatched(ep)) {
      if (ep.season === currentSeason && ep.number === currentEpisode) {
        const prevEp = episodesForSeason().find(
          (e) => e.season === ep.season && e.number === ep.number - 1,
        );
        if (prevEp) {
          onAdvance(showId, showName, prevEp.season, prevEp.number);
        } else if (ep.season > 1) {
          const prevSeasonEps = episodes.filter((e) => e.season === ep.season - 1);
          const lastEp = prevSeasonEps[prevSeasonEps.length - 1];
          if (lastEp) {
            onAdvance(showId, showName, lastEp.season, lastEp.number);
          }
        }
      }
      return;
    }
    onAdvance(showId, showName, ep.season, ep.number);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }

  $effect(() => {
    let cancelled = false;
    async function load() {
      isLoading = true;
      error = '';
      const result = await fetchEpisodes(showId);
      if (cancelled) return;
      if (isOk(result)) {
        episodes = result.data;
        if (currentProgress && seasons().includes(currentProgress.season)) {
          activeSeason = currentProgress.season;
        } else if (seasons().length > 0) {
          const first = seasons()[0];
          if (first !== undefined) activeSeason = first;
        }
      } else {
        error = result.error;
      }
      isLoading = false;
    }
    load();
    return () => { cancelled = true; };
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
  onclick={onClose}
  onkeydown={handleKeydown}
>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="mx-4 flex w-full max-w-md flex-col rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
    onclick={(e) => e.stopPropagation()}
    onkeydown={handleKeydown}
  >
    <div class="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
      <h3 class="text-sm font-semibold">{showName}</h3>
      <button
        onclick={onClose}
        class="rounded p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <div class="p-4">
      {#if isLoading}
        <div class="flex items-center justify-center py-8">
          <Loader2 class="h-5 w-5 animate-spin text-neutral-400" />
        </div>
      {:else if error}
        <p class="py-4 text-center text-sm text-red-500">{error}</p>
      {:else if episodes.length === 0}
        <p class="py-4 text-center text-sm text-neutral-400">No episodes found</p>
      {:else}
        <div class="mb-3 flex gap-1 overflow-x-auto">
          {#each seasons() as season}
            <button
              onclick={() => (activeSeason = season)}
              class="shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors {activeSeason === season
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'}"
            >
              S{season}
            </button>
          {/each}
        </div>

        {#if currentProgress}
          <button
            onclick={() => onReset(showId)}
            class="mb-3 w-full rounded-md border border-neutral-200 py-1.5 text-xs text-neutral-500 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Reset progress
          </button>
        {/if}

        <div class="max-h-60 overflow-y-auto">
          <div class="flex flex-col gap-1">
            {#each episodesForSeason() as ep (ep.number)}
              {@const watched = isWatched(ep)}
              <button
                onclick={() => handleEpisodeClick(ep)}
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <div class="flex h-5 w-5 shrink-0 items-center justify-center rounded border {watched
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-neutral-300 dark:border-neutral-600'}">
                  {#if watched}
                    <Check class="h-3 w-3" />
                  {/if}
                </div>
                <span class="shrink-0 text-xs text-neutral-400">{ep.number}</span>
                <span class="min-w-0 truncate">{ep.name}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
