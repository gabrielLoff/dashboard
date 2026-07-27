import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolveLocation, type LocationDeps } from '../src/lib/weather-location.ts';
import type { GeolocationCoords } from '../src/lib/geolocation.ts';

function makeDeps(overrides?: Partial<LocationDeps>): LocationDeps {
  return {
    getCurrentPosition: vi.fn().mockResolvedValue({ ok: false, error: 'denied' }),
    resolveCityName: vi.fn().mockResolvedValue(null),
    resolveCityFromIP: vi.fn().mockResolvedValue(null),
    loadLocationCache: vi.fn().mockReturnValue(null),
    saveLocationCache: vi.fn(),
    ...overrides,
  };
}

describe('resolveLocation', () => {
  const DEFAULT = 'Porto Alegre';

  it('returns cached coords with display name from reverse geocode', async () => {
    const deps = makeDeps({
      loadLocationCache: vi.fn().mockReturnValue({ type: 'coords', lat: -30, lon: -51, timestamp: new Date().toISOString() }),
      resolveCityName: vi.fn().mockResolvedValue({ city: 'Porto Alegre', country: 'Brazil' }),
    });

    const result = await resolveLocation(deps, DEFAULT);

    expect(result.coords).toEqual({ lat: -30, lon: -51 });
    expect(result.displayName).toBe('Porto Alegre, Brazil');
    expect(deps.getCurrentPosition).not.toHaveBeenCalled();
  });

  it('falls back to coords string when reverse geocode fails', async () => {
    const deps = makeDeps({
      loadLocationCache: vi.fn().mockReturnValue({ type: 'coords', lat: -30, lon: -51, timestamp: new Date().toISOString() }),
      resolveCityName: vi.fn().mockResolvedValue(null),
    });

    const result = await resolveLocation(deps, DEFAULT);

    expect(result.coords).toEqual({ lat: -30, lon: -51 });
    expect(result.displayName).toBe('-30.00, -51.00');
  });

  it('uses browser geolocation when no cache exists', async () => {
    const deps = makeDeps({
      getCurrentPosition: vi.fn().mockResolvedValue({ ok: true, coords: { lat: 10, lon: 20 } }),
      resolveCityName: vi.fn().mockResolvedValue({ city: 'Tokyo', country: 'Japan' }),
    });

    const result = await resolveLocation(deps, DEFAULT);

    expect(result.coords).toEqual({ lat: 10, lon: 20 });
    expect(result.displayName).toBe('Tokyo, Japan');
    expect(deps.saveLocationCache).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'coords', lat: 10, lon: 20 }),
    );
  });

  it('falls back to IP geolocation when browser geolocation fails', async () => {
    const deps = makeDeps({
      getCurrentPosition: vi.fn().mockResolvedValue({ ok: false, error: 'denied' }),
      resolveCityFromIP: vi.fn().mockResolvedValue({ city: 'Sao Paulo', country: 'Brazil' }),
    });

    const result = await resolveLocation(deps, DEFAULT);

    expect(result.coords).toBeNull();
    expect(result.displayName).toBe('Sao Paulo, Brazil (approximate)');
    expect(deps.saveLocationCache).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'city', city: DEFAULT }),
    );
  });

  it('returns default location when both geo and IP fail', async () => {
    const deps = makeDeps({
      getCurrentPosition: vi.fn().mockResolvedValue({ ok: false, error: 'denied' }),
      resolveCityFromIP: vi.fn().mockResolvedValue(null),
    });

    const result = await resolveLocation(deps, DEFAULT);

    expect(result.coords).toBeNull();
    expect(result.displayName).toBe(DEFAULT);
  });

  it('returns default location when no cache and no geo support', async () => {
    const deps = makeDeps({
      getCurrentPosition: vi.fn().mockResolvedValue({ ok: false, error: 'not supported' }),
      resolveCityFromIP: vi.fn().mockResolvedValue(null),
    });

    const result = await resolveLocation(deps, DEFAULT);

    expect(result.coords).toBeNull();
    expect(result.displayName).toBe(DEFAULT);
  });

  it('skips expired cache entries (loadLocationCache returns null)', async () => {
    const deps = makeDeps({
      loadLocationCache: vi.fn().mockReturnValue(null),
      getCurrentPosition: vi.fn().mockResolvedValue({ ok: true, coords: { lat: 5, lon: 5 } }),
      resolveCityName: vi.fn().mockResolvedValue({ city: 'Berlin', country: 'Germany' }),
    });

    const result = await resolveLocation(deps, DEFAULT);

    expect(result.coords).toEqual({ lat: 5, lon: 5 });
    expect(result.displayName).toBe('Berlin, Germany');
  });
});
