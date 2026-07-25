<script lang="ts">
  import { fromStore } from 'svelte/store';
  import { Gamepad2, Clock, ExternalLink } from 'lucide-svelte';
  import WidgetCard from '../../components/WidgetCard.svelte';
  import { useGamesQuery } from './games-api';
  import { isOk, type FreeGame } from '@dashboard/shared';

  const query = useGamesQuery();
  const result = fromStore(query);
  const data = $derived(result.data);
  const error = $derived(result.data && !isOk(result.data) ? result.data.error : '');
  const games = $derived<FreeGame[]>(data && isOk(data) ? data.data.games : []);

  function handleRefresh() {
    result.refetch();
  }

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
  isLoading={result.isLoading}
  isFetching={result.isFetching}
  error={error}
  onRefresh={handleRefresh}
>
  {#snippet icon()}
    <Gamepad2 class="h-4 w-4" />
  {/snippet}
  {#snippet children()}
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {#each games as game (game.id)}
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
    <p class="mt-3 text-center text-xs text-neutral-400">
      Powered by
      <a href="https://www.gamerpower.com" target="_blank" rel="noopener noreferrer" class="underline hover:text-neutral-500">
        GamerPower
      </a>
    </p>
  {/snippet}
</WidgetCard>
