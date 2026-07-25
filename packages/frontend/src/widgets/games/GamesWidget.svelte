<script lang="ts">
  import { Gamepad2, Clock, ExternalLink } from 'lucide-svelte';
  import WidgetCard from '../../components/WidgetCard.svelte';
  import { useGamesQuery } from './games-api';
  import { isOk, type FreeGame } from '@dashboard/shared';

  const query = useGamesQuery();
  const data = $derived(query.data);
  const error = $derived(query.data && !isOk(query.data) ? query.data.error : '');
  const games = $derived<FreeGame[]>(data && isOk(data) ? data.data.games : []);

  function handleRefresh() {
    query.refetch();
  }

  function daysUntil(dateStr: string): string {
    const now = new Date();
    const then = new Date(dateStr);
    const diff = Math.ceil((then.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Expired';
    if (diff === 1) return '1 day left';
    return `${diff} days left`;
  }
</script>

<WidgetCard
  title="Free Games"
  isLoading={query.isLoading}
  isFetching={query.isFetching}
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
  {/snippet}
</WidgetCard>
