import type { GeolocationCoords, GeolocationResult } from './geolocation.ts';
import type { CityLocation } from './reverse-geocode.ts';
import type { LocationCacheEntry } from './location-cache.ts';

export interface LocationDeps {
  getCurrentPosition: () => Promise<GeolocationResult>;
  resolveCityName: (lat: number, lon: number) => Promise<CityLocation | null>;
  resolveCityFromIP: () => Promise<CityLocation | null>;
  loadLocationCache: () => LocationCacheEntry | null;
  saveLocationCache: (entry: LocationCacheEntry) => void;
}

export interface LocationResult {
  coords: GeolocationCoords | null;
  displayName: string;
}

function formatCoords(lat: number, lon: number): string {
  return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
}

function cityLabel(loc: CityLocation): string {
  return loc.country ? `${loc.city}, ${loc.country}` : loc.city;
}

export async function resolveLocation(
  deps: LocationDeps,
  defaultLocation: string,
): Promise<LocationResult> {
  const cached = deps.loadLocationCache();
  if (cached?.type === 'coords' && cached.lat !== undefined && cached.lon !== undefined) {
    const loc = await deps.resolveCityName(cached.lat, cached.lon);
    return {
      coords: { lat: cached.lat, lon: cached.lon },
      displayName: loc ? cityLabel(loc) : formatCoords(cached.lat, cached.lon),
    };
  }

  const geo = await deps.getCurrentPosition();
  if (geo.ok) {
    const loc = await deps.resolveCityName(geo.coords.lat, geo.coords.lon);
    deps.saveLocationCache({ type: 'coords', lat: geo.coords.lat, lon: geo.coords.lon, timestamp: new Date().toISOString() });
    return {
      coords: geo.coords,
      displayName: loc ? cityLabel(loc) : formatCoords(geo.coords.lat, geo.coords.lon),
    };
  }

  const ipLoc = await deps.resolveCityFromIP();
  if (ipLoc) {
    deps.saveLocationCache({ type: 'city', city: defaultLocation, timestamp: new Date().toISOString() });
    return { coords: null, displayName: `${cityLabel(ipLoc)} (approximate)` };
  }

  deps.saveLocationCache({ type: 'city', city: defaultLocation, timestamp: new Date().toISOString() });
  return { coords: null, displayName: defaultLocation };
}
