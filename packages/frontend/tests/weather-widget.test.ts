import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';

vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

import WeatherWidget from '../src/widgets/weather/WeatherWidget.svelte';
import { ok } from '@dashboard/shared';
import type { WeatherData } from '@dashboard/shared';

const mockWeatherData: WeatherData = {
  location: 'Porto Alegre',
  temperature: 22,
  feelsLike: 20,
  humidity: 65,
  condition: 'Partly Cloudy',
  icon: 'cloud-sun',
  windSpeed: 12,
  forecast: [
    { date: '2026-07-29', high: 24, low: 16, condition: 'Sunny', icon: 'sun' },
    { date: '2026-07-30', high: 23, low: 15, condition: 'Rainy', icon: 'rain' },
  ],
  updatedAt: '2026-07-28T12:00:00Z',
};

vi.mock('$lib/widget-query', () => ({
  createWidgetQuery: () => ({
    subscribe: (fn: (val: unknown) => void) => {
      fn({ data: ok(mockWeatherData), isLoading: false, isFetching: false });
      return () => {};
    },
  }),
  createWidgetRefresh: () => vi.fn(),
}));

vi.mock('@tanstack/svelte-query', () => ({
  createQuery: () => ({
    subscribe: (fn: (val: unknown) => void) => {
      fn({ data: ok(mockWeatherData), isLoading: false, isFetching: false });
      return () => {};
    },
  }),
}));

vi.mock('$lib/api-client', () => ({
  refreshWeather: vi.fn(),
  refreshWeatherByCoords: vi.fn(),
}));

vi.mock('$lib/weather-location', () => ({
  resolveLocation: vi.fn().mockResolvedValue({ coords: null, displayName: 'Porto Alegre' }),
}));

vi.mock('$lib/geolocation', () => ({
  getCurrentPosition: vi.fn(),
}));

vi.mock('$lib/reverse-geocode', () => ({
  resolveCityName: vi.fn(),
  resolveCityFromIP: vi.fn(),
}));

vi.mock('$lib/location-cache', () => ({
  loadLocationCache: vi.fn(),
  saveLocationCache: vi.fn(),
}));

vi.mock('svelte-french-toast', () => ({
  default: { success: vi.fn() },
}));

vi.mock('$lib/query-client', () => ({
  queryClient: { setQueryData: vi.fn(), invalidateQueries: vi.fn() },
}));

describe('WeatherWidget', () => {
  it('renders temperature', () => {
    render(WeatherWidget);
    expect(screen.getByText('22°C')).toBeInTheDocument();
  });

  it('renders condition text', () => {
    render(WeatherWidget);
    expect(screen.getByText('Partly Cloudy')).toBeInTheDocument();
  });

  it('renders location', () => {
    render(WeatherWidget);
    expect(screen.getByText('Porto Alegre')).toBeInTheDocument();
  });

  it('renders feels like temperature', () => {
    render(WeatherWidget);
    expect(screen.getByText(/Feels 20°C/)).toBeInTheDocument();
  });

  it('renders humidity', () => {
    render(WeatherWidget);
    expect(screen.getByText(/65%/)).toBeInTheDocument();
  });

  it('renders wind speed', () => {
    render(WeatherWidget);
    expect(screen.getByText(/12 km\/h/)).toBeInTheDocument();
  });

  it('renders forecast strip', () => {
    render(WeatherWidget);
    expect(screen.getByText('Sunny')).toBeInTheDocument();
    expect(screen.getByText('Rainy')).toBeInTheDocument();
  });

  it('renders use my location button', () => {
    render(WeatherWidget);
    expect(screen.getByText('Use my location')).toBeInTheDocument();
  });
});
