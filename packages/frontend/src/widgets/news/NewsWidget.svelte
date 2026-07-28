<script lang="ts">
  import { Newspaper, ExternalLink } from 'lucide-svelte';
  import WidgetCard from '../../components/WidgetCard.svelte';
  import { useSourceQuery } from '$lib/query-config';
  import { isOk, queryKeys, type NewsItem } from '@dashboard/shared';
  import type { ApiResult, NewsData, NewsFilters } from '@dashboard/shared';
  import { queryClient } from '$lib/query-client';
  import { refreshNews } from '$lib/api-client';
  import toast from 'svelte-french-toast';

  let countryFilter = $state<string>('');
  let categoryFilter = $state<string>('general');
  let showAll = $state(false);

  const filters = $derived<NewsFilters>({
    country: countryFilter || undefined,
    category: categoryFilter || undefined,
  });
  const query = $derived(useSourceQuery('news', filters));
  const data = $derived<ApiResult<NewsData> | undefined>($query.data);
  const error = $derived($query.data && !isOk($query.data) ? $query.data.error : '');
  const items = $derived<NewsItem[]>(data && isOk(data) ? data.data.items : []);
  const hasMore = $derived(items.length > 5);
  const visibleItems = $derived(showAll ? items : items.slice(0, 5));

  const countryOptions = [
    { value: '', label: 'All Countries' },
    { value: 'us', label: 'US' },
    { value: 'br', label: 'BR' },
  ];

  const categoryOptions = [
    { value: 'general', label: 'General' },
    { value: 'business', label: 'Business' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'health', label: 'Health' },
    { value: 'science', label: 'Science' },
    { value: 'sports', label: 'Sports' },
    { value: 'technology', label: 'Technology' },
  ];

  async function handleRefresh(opts?: { clear?: boolean }) {
    if (opts?.clear) {
      const result = await refreshNews(filters);
      if (isOk(result)) {
        queryClient.setQueryData(queryKeys.news.list(filters), result);
        await queryClient.invalidateQueries({ queryKey: queryKeys.news.list(filters) });
        toast.success('Cache cleared');
      }
    } else {
      await $query.refetch();
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
    <div class="mb-3 flex gap-2">
      <select
        bind:value={countryFilter}
        class="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
      >
        {#each countryOptions as opt (opt.value)}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
      <select
        bind:value={categoryFilter}
        class="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-800"
      >
        {#each categoryOptions as opt (opt.value)}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>
    {#if showAll}
      <div class="max-h-96 overflow-y-auto">
        <div class="flex flex-col gap-3">
          {#each visibleItems as item (item.id)}
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
      </div>
    {:else}
      <div class="flex flex-col gap-3">
        {#each visibleItems as item (item.id)}
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
    {/if}
    {#if hasMore}
      <div class="mt-3 flex justify-center">
        <button
          onclick={() => (showAll = !showAll)}
          class="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          {showAll ? 'Show less' : `Show all (${items.length})`}
        </button>
      </div>
    {/if}
    <p class="mt-3 text-center text-xs text-neutral-400">
      Powered by
      <a href="https://www.currentsapi.services" target="_blank" rel="noopener noreferrer" class="underline hover:text-neutral-500">
        Currents API
      </a>
    </p>
  {/snippet}
</WidgetCard>
