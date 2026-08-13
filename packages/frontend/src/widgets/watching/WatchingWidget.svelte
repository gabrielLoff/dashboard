<script lang="ts">
  import { Eye } from 'lucide-svelte';
  import WidgetCard from '../../components/WidgetCard.svelte';
  import { manifest } from './manifest';
  import { createWidgetQuery, createWidgetRefresh } from '$lib/widget-query';
  import { isOk, type EpisodeProgress } from '@dashboard/shared';
  import { progressStore, progress, episodeCounts } from '$lib/progress-store';
  import { watchlist } from '$lib/show-store';
  import { fetchEpisodes } from '$lib/api-client';
  import EpisodePickerModal from './EpisodePickerModal.svelte';
  import { onMount } from 'svelte';

  let {} = $props();

  let showPickerFor = $state<number | null>(null);
  let loadingCounts = $state<Set<number>>(new Set());

  const query = $derived(createWidgetQuery(manifest));
  const error = $derived($query.data && !isOk($query.data) ? $query.data.error : '');

  const handleRefresh = createWidgetRefresh(manifest, () => $query.refetch());

  interface WatchlistShow {
    id: number;
    name: string;
    progress: EpisodeProgress | null;
    totalCount: number | undefined;
    isLoading: boolean;
  }

  const mergedShows = $derived(() => {
    const progressMap = new Map<number, EpisodeProgress>();
    for (const p of $progress) {
      progressMap.set(p.showId, p);
    }

    const shows: WatchlistShow[] = $watchlist.map((entry) => ({
      id: entry.id,
      name: entry.name,
      progress: progressMap.get(entry.id) ?? null,
      totalCount: $episodeCounts[entry.id],
      isLoading: loadingCounts.has(entry.id),
    }));

    return shows.sort((a, b) => {
      const dateA = a.progress?.watchedAt ?? '';
      const dateB = b.progress?.watchedAt ?? '';
      return dateB.localeCompare(dateA);
    });
  });

  function getProgressPercent(show: WatchlistShow): number {
    if (!show.progress || !show.totalCount || show.totalCount === 0) return 0;
    const currentEpisode = (show.progress.season - 1) * 100 + show.progress.episode;
    const totalEpisodes = show.totalCount;
    return Math.min(100, Math.round((currentEpisode / totalEpisodes) * 100));
  }

  onMount(() => {
    for (const show of $watchlist) {
      const existing = $episodeCounts[show.id];
      if (existing != null) continue;

      loadingCounts = new Set([...loadingCounts, show.id]);
      fetchEpisodes(show.id).then((result) => {
        if (isOk(result)) {
          progressStore.setEpisodeCount(show.id, result.data.length);
        }
        const next = new Set(loadingCounts);
        next.delete(show.id);
        loadingCounts = next;
      });
    }
  });

  function openPicker(showId: number) {
    showPickerFor = showId;
  }

  function closePicker() {
    showPickerFor = null;
  }

  function handleAdvance(showId: number, showName: string, season: number, episode: number) {
    progressStore.dispatch({
      type: 'ADVANCE_EPISODE',
      showId,
      showName,
      season,
      episode,
    });
  }

  function handleResetShow(showId: number) {
    progressStore.dispatch({ type: 'RESET_SHOW', showId });
  }

  function formatProgress(p: EpisodeProgress): string {
    return `S${p.season}E${p.episode}`;
  }
</script>

<WidgetCard
  title="Watching"
  query={$query}
  error={error}
  onRefresh={handleRefresh}
>
  {#snippet icon()}
    <Eye class="h-4 w-4" />
  {/snippet}
  {#snippet children()}
    <div class="flex flex-col gap-2">
      {#if mergedShows().length === 0}
        <p class="py-4 text-center text-sm text-neutral-400">No shows tracked. Add shows in the Shows widget first.</p>
      {:else}
        {#each mergedShows() as show (show.id)}
          {@const percent = getProgressPercent(show)}
          <button
            onclick={() => openPicker(show.id)}
            class="flex flex-col gap-1 rounded-lg border border-neutral-100 p-2 text-left transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            <div class="flex items-center gap-2">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{show.name}</p>
              </div>
              <span class="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
                {show.progress ? formatProgress(show.progress) : 'Not started'}
              </span>
            </div>
            <div class="h-[3px] w-full overflow-hidden rounded-full bg-transparent">
              {#if show.isLoading}
                <div class="h-full w-full animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700"></div>
              {:else}
                <div
                  class="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 ease-in-out dark:from-green-500 dark:to-green-700"
                  style:width="{percent}%"
                ></div>
              {/if}
            </div>
          </button>
        {/each}
      {/if}
    </div>
  {/snippet}
</WidgetCard>

{#if showPickerFor !== null}
  {@const pickedShow = mergedShows().find((s) => s.id === showPickerFor)}
  {#if pickedShow}
    <EpisodePickerModal
      showId={pickedShow.id}
      showName={pickedShow.name}
      currentProgress={pickedShow.progress ?? undefined}
      onAdvance={handleAdvance}
      onReset={() => handleResetShow(pickedShow.id)}
      onClose={closePicker}
    />
  {/if}
{/if}
