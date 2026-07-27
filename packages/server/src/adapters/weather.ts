import type { ApiResult, WeatherData } from '@dashboard/shared';
import { getMockWeather } from '../mock-data.ts';

export interface WeatherFetcher {
  fetch(location: string): Promise<ApiResult<WeatherData>>;
}

export const mockWeatherFetcher: WeatherFetcher = {
  fetch: () => Promise.resolve(getMockWeather()),
};