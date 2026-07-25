import type { GeolocationCoords } from '$lib/geolocation';

interface LocationCacheEntry {
  type: 'coords' | 'city';
  lat?: number;
  lon?: number;
  city?: string;
  timestamp: string;
}

const STORAGE_KEY = 'dashboard-weather-location';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function loadLocationCache(): LocationCacheEntry | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const entry = JSON.parse(raw) as LocationCacheEntry;

    if (typeof entry.type !== 'string' || typeof entry.timestamp !== 'string') {
      return null;
    }

    if (Date.now() - new Date(entry.timestamp).getTime() > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    if (entry.type === 'coords' && typeof entry.lat === 'number' && typeof entry.lon === 'number') {
      return entry;
    }

    if (entry.type === 'city' && typeof entry.city === 'string') {
      return entry;
    }

    return null;
  } catch {
    return null;
  }
}

export function saveLocationCache(entry: LocationCacheEntry): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...entry, timestamp: new Date().toISOString() }));
  } catch {
  }
}

export function clearLocationCache(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
  }
}

export function locationCacheToCoords(entry: LocationCacheEntry): GeolocationCoords | null {
  if (entry.type === 'coords' && entry.lat !== undefined && entry.lon !== undefined) {
    return { lat: entry.lat, lon: entry.lon };
  }
  return null;
}
