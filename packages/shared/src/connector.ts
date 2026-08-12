import type { ApiResult } from './result';

/**
 * A Connector is an adapter between an external API and the app's shared types.
 * It accepts domain parameters and returns `Promise<ApiResult<TData>>`.
 *
 * Every server-side connector (weather, news, agenda, games, shows) satisfies this type.
 * Routes receive connectors via injection — they never call external APIs directly.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Connector<TParams extends any[] = [], TData = unknown> = (
  ...params: TParams
) => Promise<ApiResult<TData>>;
