<script lang="ts">
  import { fromStore } from 'svelte/store';
  import { CloudSun, Thermometer, Droplets, Wind } from 'lucide-svelte';
  import WidgetCard from '../../components/WidgetCard.svelte';
  import { useWeatherQuery } from './weather-api';
  import { isOk } from '@dashboard/shared';

  const query = useWeatherQuery('Porto Alegre');
  const result = fromStore(query);
  const data = $derived(result.data);
  const error = $derived(result.data && !isOk(result.data) ? result.data.error : '');

  function handleRefresh() {
    result.refetch();
  }
</script>

<WidgetCard
  title="Weather"
  isLoading={result.isLoading}
  isFetching={result.isFetching}
  error={error}
  onRefresh={handleRefresh}
>
  {#snippet icon()}
    <CloudSun class="h-4 w-4" />
  {/snippet}
  {#snippet children()}
    {#if data && isOk(data)}
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <span class="text-4xl font-light">{data.data.temperature}°C</span>
          <span class="text-sm text-neutral-500 dark:text-neutral-400">{data.data.condition}</span>
        </div>
        <p class="text-xs text-neutral-400">{data.data.location}</p>
        <div class="flex gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <span class="flex items-center gap-1"><Thermometer class="h-3 w-3" /> Feels {data.data.feelsLike}°C</span>
          <span class="flex items-center gap-1"><Droplets class="h-3 w-3" /> {data.data.humidity}%</span>
          <span class="flex items-center gap-1"><Wind class="h-3 w-3" /> {data.data.windSpeed} km/h</span>
        </div>
      </div>
    {/if}
  {/snippet}
</WidgetCard>
