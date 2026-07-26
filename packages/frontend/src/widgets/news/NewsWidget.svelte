<script lang="ts">
  import { Newspaper, ExternalLink } from 'lucide-svelte';
  import WidgetCard from '../../components/WidgetCard.svelte';
  import { useNewsQuery } from './news-api';
  import { isOk, queryKeys, type NewsItem } from '@dashboard/shared';
  import { queryClient } from '$lib/query-client';
  import { refreshNews } from '$lib/api-client';
  import toast from 'svelte-french-toast';

  const query = useNewsQuery();
  const data = $derived($query.data);
  const error = $derived($query.data && !isOk($query.data) ? $query.data.error : '');
  const items = $derived<NewsItem[]>(data && isOk(data) ? data.data.items : []);

  async function handleRefresh(opts?: { clear?: boolean }) {
    if (opts?.clear) {
      const result = await refreshNews();
      if (isOk(result)) {
        queryClient.setQueryData(queryKeys.news.list(), result);
        queryClient.invalidateQueries({ queryKey: queryKeys.news.list() });
        toast.success('Cache cleared');
      }
    } else {
      $query.refetch();
    }
  }
</script>

<WidgetCard
  title="News"
  isLoading={$query.isLoading}
  isFetching={$query.isFetching}
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
