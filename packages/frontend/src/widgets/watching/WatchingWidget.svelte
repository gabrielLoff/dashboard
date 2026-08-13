<script lang="ts">
  import { Eye } from 'lucide-svelte';
  import WidgetCard from '../../components/WidgetCard.svelte';
  import { manifest } from './manifest';
  import { createWidgetQuery, createWidgetRefresh } from '$lib/widget-query';
  import { isOk, type EpisodeProgress } from '@dashboard/shared';
  import { progressStore, progress } from '$lib/progress-store';
  import { watchlist } from '$lib/show-store';
  import EpisodePickerModal from './EpisodePickerModal.svelte';

  let {} = $props();

  let showPickerFor = $state<number | null>(null);

  const query = $derived(createWidgetQuery(manifest));
  const error = $derived($query.data && !isOk($query.data) ? $query.data.error : '');

  const handleRefresh = createWidgetRefresh(manifest, () => $query.refetch());

  interface WatchlistShow {
    id: number;
    name: string;
    progress: EpisodeProgress | null;
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
    }));

    return shows.sort((a, b) => {
      const dateA = a.progress?.watchedAt ?? '';
      const dateB = b.progress?.watchedAt ?? '';
      return dateB.localeCompare(dateA);
    });
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
          <button
            onclick={() => openPicker(show.id)}
            class="flex items-center gap-2 rounded-lg border border-neutral-100 p-2 text-left transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{show.name}</p>
            </div>
            <span class="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
              {show.progress ? formatProgress(show.progress) : 'Not started'}
            </span>
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
