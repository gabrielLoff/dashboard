import type { ApiResult } from './result';

export interface WidgetManifest {
  id: string;
  component: unknown;
  defaultLayout: { col: number; row: number; colSpan: number; rowSpan: number };
  queryKey?: (...args: unknown[]) => readonly unknown[];
  queryFn?: (...args: unknown[]) => Promise<ApiResult<unknown>>;
  refreshFn?: (...args: unknown[]) => Promise<ApiResult<unknown>>;
  staleTime?: number;
  refetchInterval?: number;
}
