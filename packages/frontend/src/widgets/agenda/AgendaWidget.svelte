<script lang="ts">
  import { Calendar, Clock, MapPin } from 'lucide-svelte';
  import WidgetCard from '../../components/WidgetCard.svelte';
  import { useSourceQuery } from '$lib/query-config';
  import { isOk, type AgendaEvent, queryKeys } from '@dashboard/shared';
  import type { ApiResult, AgendaData } from '@dashboard/shared';
  import { queryClient } from '$lib/query-client';
  import { refreshAgenda } from '$lib/api-client';
  import toast from 'svelte-french-toast';
  import { formatRelativeDate } from '$lib/utils';
  import type { WidgetSize } from '$lib/layout-store';

  let {
    size = 'compact',
    onToggleSize,
  }: {
    size?: WidgetSize;
    onToggleSize?: () => void;
  } = $props();

  const query = useSourceQuery('agenda');
  const data = $derived<ApiResult<AgendaData> | undefined>($query.data);
  const error = $derived($query.data && !isOk($query.data) ? $query.data.error : '');
  const events = $derived<AgendaEvent[]>(data && isOk(data) ? data.data.events : []);
  const updatedAt = $derived(data && isOk(data) ? data.data.updatedAt : undefined);

  async function handleRefresh(opts?: { clear?: boolean }) {
    if (opts?.clear) {
      const result = await refreshAgenda();
      if (isOk(result)) {
        queryClient.setQueryData(queryKeys.agenda.list(), result);
        await queryClient.invalidateQueries({ queryKey: queryKeys.agenda.list() });
        toast.success('Cache cleared');
      }
    } else {
      await $query.refetch();
    }
  }
</script>

<WidgetCard
  title="Agenda"
  isLoading={$query.isLoading}
  isFetching={$query.isFetching}
  error={error}
  onRefresh={handleRefresh}
  updatedAt={updatedAt}
  {size}
  {onToggleSize}
>
  {#snippet icon()}
    <Calendar class="h-4 w-4" />
  {/snippet}
  {#snippet children()}
    <div class="flex flex-col gap-3">
      {#each events as event (event.id)}
        {@const cancelled = event.status === 'cancelled'}
        {@const tentative = event.status === 'tentative'}
        <div class="rounded-lg border border-neutral-100 p-3 dark:border-neutral-800"
             class:opacity-50={cancelled || tentative}
             class:opacity-40={cancelled}
        >
          <p class="text-sm font-medium"
             class:line-through={cancelled}
             class:text-neutral-400={cancelled}
             class:dark:text-neutral-500={cancelled}
             class:italic={tentative}
          >{event.title}</p>
          <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400"
               class:opacity-70={cancelled}
          >
            <span class="flex items-center gap-1"><Calendar class="h-3 w-3" /> {formatRelativeDate(event.date)}</span>
            {#if event.time}
              <span class="flex items-center gap-1"><Clock class="h-3 w-3" /> {event.time}</span>
            {/if}
            {#if event.location}
              <span class="flex items-center gap-1"><MapPin class="h-3 w-3" /> {event.location}</span>
            {/if}
          </div>
        </div>
      {/each}
      {#if events.length === 0}
        <p class="py-4 text-center text-sm text-neutral-400">No upcoming events</p>
      {/if}
    </div>
  {/snippet}
</WidgetCard>
