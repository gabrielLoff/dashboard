import type { ApiResult, FreeGamesData } from '@dashboard/shared';
import { getMockGames } from '../mock-data.ts';
import type { GamesFilters } from '../connectors/games.ts';

export interface GamesFetcher {
  fetch(filters: GamesFilters): Promise<ApiResult<FreeGamesData>>;
}

export const mockGamesFetcher: GamesFetcher = {
  fetch: () => Promise.resolve(getMockGames()),
};