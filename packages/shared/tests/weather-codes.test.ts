import { describe, it, expect } from 'vitest';
import { getWeatherCondition } from '../src/weather-codes.ts';

describe('getWeatherCondition', () => {
  it('maps WMO code 0 to clear sky', () => {
    expect(getWeatherCondition(0)).toEqual({ description: 'Clear sky', icon: 'sun' });
  });

  it('maps WMO code 1 to mainly clear', () => {
    expect(getWeatherCondition(1)).toEqual({ description: 'Mainly clear', icon: 'sun' });
  });

  it('maps WMO code 2 to partly cloudy', () => {
    expect(getWeatherCondition(2)).toEqual({ description: 'Partly cloudy', icon: 'cloud-sun' });
  });

  it('maps WMO code 3 to overcast', () => {
    expect(getWeatherCondition(3)).toEqual({ description: 'Overcast', icon: 'cloud' });
  });

  it('maps fog codes (45, 48)', () => {
    expect(getWeatherCondition(45).icon).toBe('fog');
    expect(getWeatherCondition(48).icon).toBe('fog');
  });

  it('maps drizzle codes (51, 53, 55)', () => {
    expect(getWeatherCondition(51).icon).toBe('drizzle');
    expect(getWeatherCondition(53).icon).toBe('drizzle');
    expect(getWeatherCondition(55).icon).toBe('drizzle');
  });

  it('maps rain codes (61, 63, 65)', () => {
    expect(getWeatherCondition(61).icon).toBe('rain');
    expect(getWeatherCondition(63).icon).toBe('rain');
    expect(getWeatherCondition(65).icon).toBe('rain');
  });

  it('maps snow codes (71, 73, 75)', () => {
    expect(getWeatherCondition(71).icon).toBe('snow');
    expect(getWeatherCondition(73).icon).toBe('snow');
    expect(getWeatherCondition(75).icon).toBe('snow');
  });

  it('maps rain shower codes (80, 81, 82)', () => {
    expect(getWeatherCondition(80).icon).toBe('cloud-rain');
    expect(getWeatherCondition(81).icon).toBe('cloud-rain');
    expect(getWeatherCondition(82).icon).toBe('cloud-rain');
  });

  it('maps thunderstorm codes (95, 96, 99)', () => {
    expect(getWeatherCondition(95).icon).toBe('bolt');
    expect(getWeatherCondition(96).icon).toBe('bolt');
    expect(getWeatherCondition(99).icon).toBe('bolt');
  });

  it('returns fallback for unknown code', () => {
    expect(getWeatherCondition(999)).toEqual({ description: 'Unknown', icon: 'cloud' });
  });

  it('returns fallback for negative code', () => {
    expect(getWeatherCondition(-1)).toEqual({ description: 'Unknown', icon: 'cloud' });
  });
});
