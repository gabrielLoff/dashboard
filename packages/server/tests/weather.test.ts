import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';

const { mockFetchWeather, mockFetchWeatherByCoords } = vi.hoisted(() => ({
  mockFetchWeather: vi.fn(),
  mockFetchWeatherByCoords: vi.fn(),
}));

vi.mock('../src/connectors/weather.ts', () => ({
  fetchWeather: mockFetchWeather,
  fetchWeatherByCoords: mockFetchWeatherByCoords,
}));

let weatherRoute: typeof import('../src/routes/weather.ts').weatherRoute;

function createApp(): Hono {
  return new Hono().route('/api/weather', weatherRoute);
}

const mockWeatherData = {
  location: 'Porto Alegre',
  temperature: 22,
  feelsLike: 20,
  humidity: 65,
  condition: 'Partly Cloudy',
  icon: 'cloud-sun',
  windSpeed: 12,
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockCoordsWeatherData = {
  location: 'Sao Paulo',
  temperature: 28,
  feelsLike: 30,
  humidity: 70,
  condition: 'Clear sky',
  icon: 'sun',
  windSpeed: 8,
  updatedAt: '2025-01-01T00:00:00.000Z',
};

beforeEach(async () => {
  vi.resetModules();

  mockFetchWeather.mockReset();
  mockFetchWeatherByCoords.mockReset();

  const mod = await import('../src/routes/weather.ts');
  weatherRoute = mod.weatherRoute;
});

describe('GET /api/weather', () => {
  it('returns weather for a named location', async () => {
    mockFetchWeather.mockResolvedValue({ ok: true, data: { ...mockWeatherData } });

    const app = createApp();
    const res = await app.request('/api/weather?location=Tokyo');
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.data.location).toBe('Porto Alegre');
    expect(mockFetchWeather).toHaveBeenCalledWith('Tokyo');
  });

  it('returns weather for lat/lon coordinates', async () => {
    mockFetchWeatherByCoords.mockResolvedValue({ ok: true, data: { ...mockCoordsWeatherData } });

    const app = createApp();
    const res = await app.request('/api/weather?lat=-23.55&lon=-46.63');
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.data.location).toBe('Sao Paulo');
    expect(mockFetchWeatherByCoords).toHaveBeenCalledWith(-23.55, -46.63);
  });

  it('falls back to default location when no params given', async () => {
    mockFetchWeather.mockResolvedValue({ ok: true, data: { ...mockWeatherData } });

    const app = createApp();
    const res = await app.request('/api/weather');
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(mockFetchWeather).toHaveBeenCalledWith('Porto Alegre');
  });

  it('uses coordinate-based flow when lat/lon provided', async () => {
    mockFetchWeatherByCoords.mockResolvedValue({ ok: true, data: { ...mockCoordsWeatherData } });

    const app = createApp();
    const res = await app.request('/api/weather?lat=-23.55&lon=-46.63');
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(mockFetchWeatherByCoords).toHaveBeenCalledWith(-23.55, -46.63);
    expect(mockFetchWeather).not.toHaveBeenCalled();
  });

  it('propagates connector errors', async () => {
    mockFetchWeather.mockResolvedValue({ ok: false, error: 'City not found' });

    const app = createApp();
    const res = await app.request('/api/weather?location=Nowhere');
    const json = await res.json();

    expect(json.ok).toBe(false);
    expect(json.error).toBe('City not found');
  });

  it('caches responses and returns cached data on subsequent calls', async () => {
    mockFetchWeather.mockResolvedValue({ ok: true, data: { ...mockWeatherData } });

    const app = createApp();
    await app.request('/api/weather?location=Porto+Alegre');
    await app.request('/api/weather?location=Porto+Alegre');

    expect(mockFetchWeather).toHaveBeenCalledTimes(1);
  });

  it('caches coordinate-based responses separately', async () => {
    mockFetchWeatherByCoords.mockResolvedValue({ ok: true, data: { ...mockCoordsWeatherData } });

    const app = createApp();
    await app.request('/api/weather?lat=-23.55&lon=-46.63');
    await app.request('/api/weather?lat=-23.55&lon=-46.63');

    expect(mockFetchWeatherByCoords).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/weather/refresh', () => {
  it('refreshes weather for a named location (bypasses cache)', async () => {
    mockFetchWeather.mockResolvedValue({ ok: true, data: { ...mockWeatherData } });

    const app = createApp();
    await app.request('/api/weather?location=Porto+Alegre');
    await app.request('/api/weather/refresh?location=Porto+Alegre', { method: 'POST' });
    await app.request('/api/weather?location=Porto+Alegre');

    expect(mockFetchWeather).toHaveBeenCalledTimes(2);
  });

  it('refreshes weather for coordinates (bypasses cache)', async () => {
    mockFetchWeatherByCoords.mockResolvedValue({ ok: true, data: { ...mockCoordsWeatherData } });

    const app = createApp();
    await app.request('/api/weather?lat=-23.55&lon=-46.63');
    await app.request('/api/weather/refresh?lat=-23.55&lon=-46.63', { method: 'POST' });
    await app.request('/api/weather?lat=-23.55&lon=-46.63');

    expect(mockFetchWeatherByCoords).toHaveBeenCalledTimes(2);
  });

  it('refreshes with default location when no params given', async () => {
    mockFetchWeather.mockResolvedValue({ ok: true, data: { ...mockWeatherData } });

    const app = createApp();
    const res = await app.request('/api/weather/refresh', { method: 'POST' });
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(mockFetchWeather).toHaveBeenCalledWith('Porto Alegre');
  });
});
