import type { ApiResult, AgendaData } from '@dashboard/shared';
import { getMockAgenda } from '../mock-data.ts';

export interface AgendaFetcher {
  fetch(): Promise<ApiResult<AgendaData>>;
}

export const mockAgendaFetcher: AgendaFetcher = {
  fetch: () => Promise.resolve(getMockAgenda()),
};