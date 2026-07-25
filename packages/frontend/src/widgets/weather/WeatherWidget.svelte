<script lang="ts">
  import { onMount } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import { createQuery } from '@tanstack/svelte-query';
  import type { CreateQueryOptions } from '@tanstack/svelte-query';
  import { queryKeys, isOk } from '@dashboard/shared';
  import type { ApiResult, WeatherData } from '@dashboard/shared';
  import { fetchWeather, fetchWeatherByCoords } from '$lib/api-client';
  import { getCurrentPosition, type GeolocationCoords } from '$lib/geolocation';
  import { CloudSun, Thermometer, Droplets, Wind } from 'lucide-svelte';
  import WidgetCard from '../../components/WidgetCard.svelte';

  const DEFAULT_LOCATION = 'Porto Alegre';

  const coords = writable<GeolocationCoords | null>(null);
  let geoPending = $state(true);
  let geoFallback = $state(false);

  const queryOptions = derived(coords, ($coords): CreateQueryOptions<ApiResult<WeatherData>> => {
    if ($coords) {
      return {
        queryKey: queryKeys.weather.byCoords($coords.lat, $coords.lon) as unknown as string[],
        queryFn: () => fetchWeatherByCoords($coords.lat, $coords.lon),
        staleTime: 5 * 60 * 1000,
        refetchInterval: 10 * 60 * 1000,
      };
    }
    return {
      queryKey: queryKeys.weather.current() as unknown as string[],
      queryFn: () => fetchWeather(DEFAULT_LOCATION),
      staleTime: 5 * 60 * 1000,
      refetchInterval: 10 * 60 * 1000,
    };
  });

  const query = createQuery(queryOptions);

  const data = $derived($query.data as ApiResult<WeatherData> | undefined);
  const error = $derived(data && !isOk(data) ? data.error : '');

  onMount(async () => {
    const result = await getCurrentPosition();
    geoPending = false;
    if (result.ok) {
      coords.set(result.coords);
    } else {
      geoFallback = true;
    }
  });

  function handleRefresh() {
    $query.refetch();
  }
</script>

<WidgetCard
  title="Weather"
  isLoading={$query.isLoading || geoPending}
  isFetching={$query.isFetching}
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
        <p class="text-xs text-neutral-400">
          {data.data.location}
          {#if geoFallback}
            <span class="text-neutral-500"> (default)</span>
          {/if}
        </p>
        <div class="flex gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <span class="flex items-center gap-1"><Thermometer class="h-3 w-3" /> Feels {data.data.feelsLike}°C</span>
          <span class="flex items-center gap-1"><Droplets class="h-3 w-3" /> {data.data.humidity}%</span>
          <span class="flex items-center gap-1"><Wind class="h-3 w-3" /> {data.data.windSpeed} km/h</span>
        </div>
      </div>
    {/if}
  {/snippet}
</WidgetCard>
