<script lang="ts">
  import { fromStore } from 'svelte/store';
  import { Newspaper, ExternalLink } from 'lucide-svelte';
  import WidgetCard from '../../components/WidgetCard.svelte';
  import { useNewsQuery } from './news-api';
  import { isOk, type NewsItem } from '@dashboard/shared';

  const query = useNewsQuery();
  const result = fromStore(query);
  const data = $derived(result.data);
  const error = $derived(result.data && !isOk(result.data) ? result.data.error : '');
  const items = $derived<NewsItem[]>(data && isOk(data) ? data.data.items : []);

  function handleRefresh() {
    result.refetch();
  }
</script>

<WidgetCard
  title="News"
  isLoading={result.isLoading}
  isFetching={result.isFetching}
  error={error}
  onRefresh={handleRefresh}
>
  {#snippet icon()}
    <Newspaper class="h-4 w-4" />
  {/snippet}
  {#snippet children()}
    <div class="flex flex-col gap-3">
      {#each items as item (item.id)}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          class="group rounded-lg p-2 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="text-sm font-medium group-hover:text-primary-600">{item.title}</p>
            <ExternalLink class="mt-0.5 h-3 w-3 shrink-0 text-neutral-300 group-hover:text-primary-500" />
          </div>
          <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{item.source}</p>
        </a>
      {/each}
    </div>
  {/snippet}
</WidgetCard>
