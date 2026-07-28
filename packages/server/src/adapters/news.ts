import type { ApiResult, NewsData, NewsFilters } from '@dashboard/shared';
import { getMockNews } from '../mock-data.ts';

export interface NewsFetcher {
  fetch(filters?: NewsFilters): Promise<ApiResult<NewsData>>;
}

export const mockNewsFetcher: NewsFetcher = {
  fetch: () => Promise.resolve(getMockNews()),
};
