import { describe, it, expect, vi } from 'vitest';
import { mockWeatherFetcher } from '../../src/adapters/weather.ts';

vi.mock('../../src/mock-data.ts', () => ({
  getMockWeather: vi.fn(() => ({
    ok: true,
    data: {
      location: 'Porto Alegre',
      temperature: 22,
      feelsLike: 20,
      humidity: 65,
      condition: 'Partly Cloudy',
      icon: 'cloud-sun',
      windSpeed: 12,
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
  })),
}));

describe('mockWeatherFetcher', () => {
  it('returns a successful weather result', async () => {
    const result = await mockWeatherFetcher.fetch('Tokyo');
    expect(result.ok).toBe(true);
  });

  it('returns WeatherData with expected fields', async () => {
    const result = await mockWeatherFetcher.fetch('Tokyo');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveProperty('location');
      expect(result.data).toHaveProperty('temperature');
      expect(result.data).toHaveProperty('feelsLike');
      expect(result.data).toHaveProperty('humidity');
      expect(result.data).toHaveProperty('condition');
      expect(result.data).toHaveProperty('icon');
      expect(result.data).toHaveProperty('windSpeed');
      expect(result.data).toHaveProperty('updatedAt');
    }
  });

  it('returns fixture data from getMockWeather', async () => {
    const result = await mockWeatherFetcher.fetch('Tokyo');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.location).toBe('Porto Alegre');
      expect(result.data.temperature).toBe(22);
    }
  });

  it('ignores the location parameter', async () => {
    const result1 = await mockWeatherFetcher.fetch('Tokyo');
    const result2 = await mockWeatherFetcher.fetch('Sydney');
    expect(result1.ok).toBe(result2.ok);
    if (result1.ok && result2.ok) {
      expect(result1.data.location).toBe(result2.data.location);
    }
  });
});