<script lang="ts">
  import { onMount } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import { createQuery } from '@tanstack/svelte-query';
  import type { CreateQueryOptions } from '@tanstack/svelte-query';
  import { queryKeys, isOk } from '@dashboard/shared';
  import type { ApiResult, WeatherData } from '@dashboard/shared';
  import { fetchWeather, fetchWeatherByCoords } from '$lib/api-client';
  import { getCurrentPosition, type GeolocationCoords } from '$lib/geolocation';
  import { loadLocationCache, saveLocationCache, locationCacheToCoords } from '$lib/location-cache';
  import { resolveCityName, resolveCityFromIP } from '$lib/reverse-geocode';
  import { CloudSun, Thermometer, Droplets, Wind, MapPin } from 'lucide-svelte';
  import WidgetCard from '../../components/WidgetCard.svelte';

  const DEFAULT_LOCATION = 'Porto Alegre';

  const coords = writable<GeolocationCoords | null>(null);
  let geoPending = $state(false);
  let geoDenied = $state(false);
  let displayLocation = $state<string | null>(null);

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

  async function resolveAndSetLocation(lat: number, lon: number) {
    const location = await resolveCityName(lat, lon);
    if (location) {
      displayLocation = location.country ? `${location.city}, ${location.country}` : location.city;
    } else {
      displayLocation = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    }
  }

  onMount(() => {
    const cached = loadLocationCache();
    if (cached) {
      const cachedCoords = locationCacheToCoords(cached);
      if (cachedCoords) {
        coords.set(cachedCoords);
        resolveAndSetLocation(cachedCoords.lat, cachedCoords.lon);
      }
    }
  });

  async function useGeolocation() {
    geoDenied = false;
    geoPending = true;
    const result = await getCurrentPosition();
    geoPending = false;
    if (result.ok) {
      coords.set(result.coords);
      displayLocation = null;
      resolveAndSetLocation(result.coords.lat, result.coords.lon);
      saveLocationCache({ type: 'coords', lat: result.coords.lat, lon: result.coords.lon, timestamp: new Date().toISOString() });
    } else {
      const ipLocation = await resolveCityFromIP();
      if (ipLocation) {
        const label = ipLocation.country ? `${ipLocation.city}, ${ipLocation.country}` : ipLocation.city;
        displayLocation = `${label} (approximate)`;
        geoDenied = false;
      } else {
        geoDenied = true;
      }
      saveLocationCache({ type: 'city', city: DEFAULT_LOCATION, timestamp: new Date().toISOString() });
    }
  }

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
        <div class="flex items-center gap-2">
          <p class="text-xs text-neutral-400">{displayLocation ?? data.data.location}</p>
          {#if !coords}
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
