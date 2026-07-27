<script lang="ts">
  import { onMount } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import type { CreateQueryOptions } from '@tanstack/svelte-query';
  import { createQuery } from '@tanstack/svelte-query';
  import { queryKeys, isOk } from '@dashboard/shared';
  import type { ApiResult, WeatherData } from '@dashboard/shared';
  import { refreshWeather, refreshWeatherByCoords } from '$lib/api-client';
  import { buildWeatherQueryOptions } from '$lib/query-config';
  import { queryClient } from '$lib/query-client';
  import toast from 'svelte-french-toast';
  import { getCurrentPosition, type GeolocationCoords } from '$lib/geolocation';
  import { loadLocationCache, saveLocationCache } from '$lib/location-cache';
  import { resolveCityName, resolveCityFromIP } from '$lib/reverse-geocode';
  import { resolveLocation } from '$lib/weather-location';
  import { CloudSun, Thermometer, Droplets, Wind, MapPin } from 'lucide-svelte';
  import WidgetCard from '../../components/WidgetCard.svelte';

  const DEFAULT_LOCATION = 'Porto Alegre';
  const locationDeps = { getCurrentPosition, resolveCityName, resolveCityFromIP, loadLocationCache, saveLocationCache };

  const coords = writable<GeolocationCoords | null>(null);
  let geoPending = $state(false);
  let geoDenied = $state(false);
  let displayLocation = $state<string | null>(null);

  const queryOptions = derived(coords, ($coords): CreateQueryOptions<ApiResult<WeatherData>> =>
    buildWeatherQueryOptions($coords ? { lat: $coords.lat, lon: $coords.lon } : { location: DEFAULT_LOCATION }) as CreateQueryOptions<ApiResult<WeatherData>>,
  );

  const query = createQuery(queryOptions);

  const data = $derived($query.data);
  const error = $derived(data && !isOk(data) ? data.error : '');

  onMount(async () => {
    const result = await resolveLocation(locationDeps, DEFAULT_LOCATION);
    coords.set(result.coords);
    displayLocation = result.displayName;
  });

  async function useGeolocation() {
    geoDenied = false;
    geoPending = true;
    const result = await resolveLocation(locationDeps, DEFAULT_LOCATION);
    geoPending = false;
    coords.set(result.coords);
    displayLocation = result.displayName;
    if (!result.coords) {
      geoDenied = true;
    }
  }

  async function handleRefresh(opts?: { clear?: boolean }) {
    if (opts?.clear) {
      const result = $coords
        ? await refreshWeatherByCoords($coords.lat, $coords.lon)
        : await refreshWeather(DEFAULT_LOCATION);
      const key = $coords
        ? queryKeys.weather.byCoords($coords.lat, $coords.lon)
        : queryKeys.weather.current();
      if (isOk(result)) {
        queryClient.setQueryData(key as unknown as string[], result);
        await queryClient.invalidateQueries({ queryKey: key as unknown as string[] });
        toast.success('Cache cleared');
      }
    } else {
      await $query.refetch();
    }
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
        <div class="flex items-center gap-2">
          <p class="text-xs text-neutral-400">{displayLocation ?? data.data.location}</p>
          {#if !$coords}
            <button
              onclick={useGeolocation}
              disabled={geoPending}
              class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-50 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              title="Use my location"
            >
              <MapPin class="h-3 w-3" />
              {geoPending ? 'Locating...' : 'Use my location'}
            </button>
          {:else if geoDenied}
            <span class="text-xs text-neutral-500">(location unavailable)</span>
          {/if}
        </div>
        <div class="flex gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <span class="flex items-center gap-1"><Thermometer class="h-3 w-3" /> Feels {data.data.feelsLike}°C</span>
          <span class="flex items-center gap-1"><Droplets class="h-3 w-3" /> {data.data.humidity}%</span>
          <span class="flex items-center gap-1"><Wind class="h-3 w-3" /> {data.data.windSpeed} km/h</span>
        </div>
      </div>
    {/if}
  {/snippet}
</WidgetCard>
