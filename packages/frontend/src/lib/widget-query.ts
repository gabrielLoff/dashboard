import { createQuery } from '@tanstack/svelte-query';
import {
  ENDPOINT_META,
  request,
  type EndpointInput,
  type EndpointKey,
} from '@dashboard/shared';
import { queryClient } from './query-client';
import { createRefreshHandler } from './refresh';

/** The shape a query-backed manifest must have for its endpoint to stay literal-typed. */
interface QueryManifestShape<K extends EndpointKey> {
  endpoint: K;
  staleTime: number;
  refetchInterval: number;
}

/**
 * Creates a TanStack Query from a query-backed widget manifest.
 * The endpoint's cache key and request are derived from the manifest's `endpoint`;
 * the widget's dynamic args are the endpoint's input.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createWidgetQuery<K extends EndpointKey>(manifest: QueryManifestShape<K>, ...args: any[]) {
  const meta = ENDPOINT_META[manifest.endpoint];
  const input = args[0] as EndpointInput<K> | undefined;
  return createQuery({
    queryKey: meta.cacheKey(input),
    queryFn: () => request(manifest.endpoint, input),
    staleTime: manifest.staleTime,
    refetchInterval: manifest.refetchInterval,
  });
}

/**
 * Creates a refresh handler from a query-backed widget manifest.
 *
 * When the endpoint has a paired cache-bust, Alt-click "clear cache" calls it and
 * invalidates the query. When it doesn't (uncached reads, writes), every refresh
 * is a plain refetch.
 *
 * `getArgs` is called at refresh time to get the current args (avoids stale closures).
 */
export function createWidgetRefresh<K extends EndpointKey>(
  manifest: QueryManifestShape<K>,
  refetchFn: () => Promise<unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getArgs: () => any[] = () => [],
) {
  const meta = ENDPOINT_META[manifest.endpoint];
  const input = (): EndpointInput<K> | undefined => getArgs()[0] as EndpointInput<K> | undefined;
  const refreshKey = meta.refresh;

  if (!refreshKey) {
    return async () => {
      await refetchFn();
    };
  }

  return createRefreshHandler(
    queryClient,
    () => request(refreshKey, input() as EndpointInput<typeof refreshKey>),
    () => meta.cacheKey(input()),
    refetchFn,
  );
}
