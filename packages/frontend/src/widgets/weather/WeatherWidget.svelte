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
  import { createRefreshHandler } from '$lib/refresh';
  import { getCurrentPosition, type GeolocationCoords } from '$lib/geolocation';
  import { loadLocationCache, saveLocationCache } from '$lib/location-cache';
  import { resolveCityName, resolveCityFromIP } from '$lib/reverse-geocode';
  import { resolveLocation } from '$lib/weather-location';
  import { CloudSun, Thermometer, Droplets, Wind, MapPin } from 'lucide-svelte';
  import WidgetCard from '../../components/WidgetCard.svelte';

  import SunAnimation from './animations/SunAnimation.svelte';
  import CloudSunAnimation from './animations/CloudSunAnimation.svelte';
  import CloudAnimation from './animations/CloudAnimation.svelte';
  import FogAnimation from './animations/FogAnimation.svelte';
  import DrizzleAnimation from './animations/DrizzleAnimation.svelte';
  import RainAnimation from './animations/RainAnimation.svelte';
  import CloudRainAnimation from './animations/CloudRainAnimation.svelte';
  import SnowAnimation from './animations/SnowAnimation.svelte';
  import BoltAnimation from './animations/BoltAnimation.svelte';

  let {
  }: {} = $props();

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

  const ANIMATION_MAP: Record<string, any> = {
    sun: SunAnimation,
    'cloud-sun': CloudSunAnimation,
    cloud: CloudAnimation,
    fog: FogAnimation,
    drizzle: DrizzleAnimation,
    rain: RainAnimation,
    'cloud-rain': CloudRainAnimation,
    snow: SnowAnimation,
    bolt: BoltAnimation,
  };

  const data = $derived($query.data);
  const weatherIcon = $derived(data && isOk(data) ? data.data.icon : '');
  const AnimationComponent = $derived(ANIMATION_MAP[weatherIcon] ?? null);
  const error = $derived(data && !isOk(data) ? data.error : '');
  const updatedAt = $derived(data && isOk(data) ? data.data.updatedAt : undefined);

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

  const handleRefresh = createRefreshHandler(
    queryClient,
    () => $coords
      ? refreshWeatherByCoords($coords.lat, $coords.lon)
      : refreshWeather(DEFAULT_LOCATION),
    () => $coords
      ? queryKeys.weather.byCoords($coords.lat, $coords.lon)
      : queryKeys.weather.current(),
    () => $query.refetch(),
  );

  function formatDayName(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
</script>

<WidgetCard
  title="Weather"
  isLoading={$query.isLoading || geoPending}
  isFetching={$query.isFetching}
  error={error}
  onRefresh={handleRefresh}
  updatedAt={updatedAt}

>
  {#snippet background()}
    {#if AnimationComponent}
      <AnimationComponent />
    {/if}
  {/snippet}
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
        {#if data.data.forecast.length > 0}
          <div class="mt-2 flex gap-2 overflow-x-auto">
            {#each data.data.forecast as day}
              <div class="flex flex-col items-center gap-1 rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800">
                <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400">{formatDayName(day.date)}</span>
                <span class="text-xs text-neutral-400 dark:text-neutral-500">{day.high}°/{day.low}°</span>
                <span class="text-xs capitalize text-neutral-500 dark:text-neutral-400">{day.condition}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  {/snippet}
</WidgetCard>
