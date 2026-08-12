import type { ApiResult } from './result';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArgs = any[];

export type WidgetZone = 'left' | 'carousel';

export interface WidgetManifest {
  id: string;
  component: unknown;
  defaultLayout: { col: number; row: number; colSpan: number; rowSpan: number };
  zone?: WidgetZone;
  queryKey?: (...args: AnyArgs) => readonly unknown[];
  queryFn?: (...args: AnyArgs) => Promise<ApiResult<unknown>>;
  refreshFn?: (...args: AnyArgs) => Promise<ApiResult<unknown>>;
  staleTime?: number;
  refetchInterval?: number;
}
