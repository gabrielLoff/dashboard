import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getTimePeriod,
  getWeatherBucket,
  applyGradient,
  GRADIENT_FLAT,
  WEATHER_BUCKETS,
} from '../src/lib/gradient-theme';

describe('gradient-theme', () => {
  describe('getTimePeriod', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns morning for hours 6-11', () => {
      vi.setSystemTime(new Date(2024, 0, 1, 9));
      expect(getTimePeriod()).toBe('morning');
    });

    it('returns afternoon for hours 12-17', () => {
      vi.setSystemTime(new Date(2024, 0, 1, 15));
      expect(getTimePeriod()).toBe('afternoon');
    });

    it('returns evening for hours 18-21', () => {
      vi.setSystemTime(new Date(2024, 0, 1, 20));
      expect(getTimePeriod()).toBe('evening');
    });

    it('returns night for hours 22-5', () => {
      vi.setSystemTime(new Date(2024, 0, 1, 23));
      expect(getTimePeriod()).toBe('night');
    });

    it('returns night for early morning hours', () => {
      vi.setSystemTime(new Date(2024, 0, 1, 3));
      expect(getTimePeriod()).toBe('night');
    });
  });

  describe('getWeatherBucket', () => {
    it('maps sun to clear', () => {
      expect(getWeatherBucket('sun')).toBe('clear');
    });

    it('maps cloud-sun to clear', () => {
      expect(getWeatherBucket('cloud-sun')).toBe('clear');
    });

    it('maps cloud to cloudy', () => {
      expect(getWeatherBucket('cloud')).toBe('cloudy');
    });

    it('maps fog to cloudy', () => {
      expect(getWeatherBucket('fog')).toBe('cloudy');
    });

    it('maps drizzle to cloudy', () => {
      expect(getWeatherBucket('drizzle')).toBe('cloudy');
    });

    it('maps rain to precip', () => {
      expect(getWeatherBucket('rain')).toBe('precip');
    });

    it('maps snow to precip', () => {
      expect(getWeatherBucket('snow')).toBe('precip');
    });

    it('maps bolt to precip', () => {
      expect(getWeatherBucket('bolt')).toBe('precip');
    });

    it('returns cloudy for unknown icons', () => {
      expect(getWeatherBucket('unknown')).toBe('cloudy');
    });
  });

  describe('applyGradient', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 0, 1, 9));
      document.documentElement.style.removeProperty('--bg-from');
      document.documentElement.style.removeProperty('--bg-to');
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('sets CSS custom properties on documentElement', () => {
      applyGradient('sun', 'light');
      const from = document.documentElement.style.getPropertyValue('--bg-from');
      const to = document.documentElement.style.getPropertyValue('--bg-to');
      expect(from).toBeTruthy();
      expect(to).toBeTruthy();
    });

    it('uses light palette when theme is light', () => {
      applyGradient('sun', 'light');
      const key = `${getTimePeriod()}-clear`;
      const expected = GRADIENT_FLAT[key]!.light;
      expect(document.documentElement.style.getPropertyValue('--bg-from')).toBe(expected[0]);
      expect(document.documentElement.style.getPropertyValue('--bg-to')).toBe(expected[1]);
    });

    it('uses dark palette when theme is dark', () => {
      applyGradient('sun', 'dark');
      const key = `${getTimePeriod()}-clear`;
      const expected = GRADIENT_FLAT[key]!.dark;
      expect(document.documentElement.style.getPropertyValue('--bg-from')).toBe(expected[0]);
      expect(document.documentElement.style.getPropertyValue('--bg-to')).toBe(expected[1]);
    });
  });

  describe('constants', () => {
    it('GRADIENT_FLAT has 12 entries', () => {
      expect(Object.keys(GRADIENT_FLAT)).toHaveLength(12);
    });

    it('WEATHER_BUCKETS has entries for all known icons', () => {
      expect(WEATHER_BUCKETS['sun']).toBe('clear');
      expect(WEATHER_BUCKETS['rain']).toBe('precip');
      expect(WEATHER_BUCKETS['cloud']).toBe('cloudy');
    });
  });
});
