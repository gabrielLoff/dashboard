<script lang="ts">
  import { Calendar, Clock, MapPin } from 'lucide-svelte';
  import WidgetCard from '../../components/WidgetCard.svelte';
  import { useAgendaQuery } from './agenda-api';
  import { isOk, type AgendaEvent } from '@dashboard/shared';

  const query = useAgendaQuery();
  const data = $derived($query.data);
  const error = $derived($query.data && !isOk($query.data) ? $query.data.error : '');
  const events = $derived<AgendaEvent[]>(data && isOk(data) ? data.data.events : []);

  function handleRefresh() {
    $query.refetch();
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
</script>

<WidgetCard
  title="Agenda"
  isLoading={$query.isLoading}
  isFetching={$query.isFetching}
  error={error}
  onRefresh={handleRefresh}
>
  {#snippet icon()}
    <Calendar class="h-4 w-4" />
  {/snippet}
  {#snippet children()}
    <div class="flex flex-col gap-3">
      {#each events as event (event.id)}
        <div class="rounded-lg border border-neutral-100 p-3 dark:border-neutral-800">
          <p class="text-sm font-medium">{event.title}</p>
          <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
            <span class="flex items-center gap-1"><Calendar class="h-3 w-3" /> {formatDate(event.date)}</span>
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
