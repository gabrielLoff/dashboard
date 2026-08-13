<script lang="ts">
  import { Eye } from 'lucide-svelte';
  import WidgetCard from '../../components/WidgetCard.svelte';
  import { manifest } from './manifest';
  import { createWidgetQuery, createWidgetRefresh } from '$lib/widget-query';
  import { isOk, type EpisodeProgress } from '@dashboard/shared';
  import { progressStore, progress } from '$lib/progress-store';
  import EpisodePickerModal from './EpisodePickerModal.svelte';

  let {} = $props();

  let showPickerFor = $state<number | null>(null);

  const query = $derived(createWidgetQuery(manifest));
  const error = $derived($query.data && !isOk($query.data) ? $query.data.error : '');

  const handleRefresh = createWidgetRefresh(manifest, () => $query.refetch());

  const sortedProgress = $derived(() => {
    return [...$progress].sort((a, b) => {
      const dateA = a.watchedAt ?? '';
      const dateB = b.watchedAt ?? '';
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

  function getShowName(showId: number): string {
    const entry = $progress.find((p) => p.showId === showId);
    return entry?.showName ?? `Show #${showId}`;
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
      {#if sortedProgress().length === 0}
        <p class="py-4 text-center text-sm text-neutral-400">No shows being watched. Add shows in the Shows widget first.</p>
      {:else}
        {#each sortedProgress() as p (p.showId)}
          <button
            onclick={() => openPicker(p.showId)}
            class="flex items-center gap-2 rounded-lg border border-neutral-100 p-2 text-left transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{getShowName(p.showId)}</p>
            </div>
            <span class="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
              {formatProgress(p)}
            </span>
          </button>
        {/each}
      {/if}
    </div>
  {/snippet}
</WidgetCard>

{#if showPickerFor !== null}
  <EpisodePickerModal
    showId={showPickerFor}
    showName={getShowName(showPickerFor)}
    currentProgress={$progress.find((p) => p.showId === showPickerFor)}
    onAdvance={handleAdvance}
    onReset={() => { if (showPickerFor !== null) handleResetShow(showPickerFor); }}
    onClose={closePicker}
  />
{/if}
