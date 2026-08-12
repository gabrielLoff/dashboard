import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { fetchWeather, fetchWeatherByCoords } from '../src/connectors/weather.ts';

const mockGeocodingResponse = {
  results: [
    {
      latitude: -30.03,
      longitude: -51.21,
      name: 'Porto Alegre',
      country: 'Brazil',
    },
  ],
};

const mockForecastResponse = {
  current: {
    temperature_2m: 22,
    relative_humidity_2m: 65,
    apparent_temperature: 20,
    wind_speed_10m: 12,
    weather_code: 2,
  },
  daily: {
    time: ['2026-07-28', '2026-07-29', '2026-07-30', '2026-07-31', '2026-08-01'],
    temperature_2m_max: [24, 25, 23, 22, 26],
    temperature_2m_min: [16, 17, 15, 14, 18],
    weather_code: [0, 1, 2, 3, 0],
  },
};

describe('fetchWeather', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('geocodes location then fetches forecast', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockForecastResponse),
      });

    const result = await fetchWeather('Porto Alegre');

    expect(result.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(1,
      expect.stringContaining('geocoding-api.open-meteo.com'),
    );
    expect(mockFetch).toHaveBeenNthCalledWith(2,
      expect.stringContaining('api.open-meteo.com/v1/forecast'),
    );
  });

  it('returns WeatherData with correct shape', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockForecastResponse),
      });

    const result = await fetchWeather('Porto Alegre');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toMatchObject({
        location: 'Porto Alegre',
        temperature: 22,
        feelsLike: 20,
        humidity: 65,
        windSpeed: 12,
        forecast: expect.arrayContaining([
          expect.objectContaining({
            date: expect.any(String),
            high: expect.any(Number),
            low: expect.any(Number),
            condition: expect.any(String),
            icon: expect.any(String),
          }),
        ]),
      });
      expect(result.data.forecast).toHaveLength(5);
      expect(result.data.updatedAt).toBeDefined();
    }
  });

  it('returns error when geocoding fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const result = await fetchWeather('Nonexistent');
    expect(result.ok).toBe(false);
  });

  it('returns error when location not found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });

    const result = await fetchWeather('Nonexistent');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Location not found');
    }
  });

  it('returns error when forecast fails', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeocodingResponse),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

    const result = await fetchWeather('Porto Alegre');
    expect(result.ok).toBe(false);
  });

  it('returns error on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await fetchWeather('Porto Alegre');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Network error');
    }
  });
});

describe('fetchWeatherByCoords', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches forecast directly without geocoding', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockForecastResponse),
    });

    const result = await fetchWeatherByCoords(-30.03, -51.21);

    expect(result.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('latitude=-30.03'),
    );
  });

  it('uses coords as location name', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockForecastResponse),
    });

    const result = await fetchWeatherByCoords(-30.03, -51.21);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.location).toContain('-30.03');
      expect(result.data.location).toContain('-51.21');
    }
  });

  it('returns error on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('Connection refused'));

    const result = await fetchWeatherByCoords(-30.03, -51.21);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Connection refused');
    }
  });
});
