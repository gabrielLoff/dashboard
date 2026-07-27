import type { ApiResult, NewsData } from '@dashboard/shared';
import { getMockNews } from '../mock-data.ts';

export interface NewsFetcher {
  fetch(): Promise<ApiResult<NewsData>>;
}

export const mockNewsFetcher: NewsFetcher = {
  fetch: () => getMockNews(),
};