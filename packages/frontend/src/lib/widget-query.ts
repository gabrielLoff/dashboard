import { createQuery } from '@tanstack/svelte-query';
import type { WidgetManifest } from '@dashboard/shared';
import { queryClient } from './query-client';
import { createRefreshHandler } from './refresh';

/**
 * Creates a TanStack Query from a widget manifest.
 * The manifest's queryKey and queryFn are called with the widget's dynamic args.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createWidgetQuery(manifest: WidgetManifest, ...args: any[]) {
  if (!manifest.queryKey || !manifest.queryFn || manifest.staleTime == null || manifest.refetchInterval == null) {
    throw new Error(`Manifest "${manifest.id}" does not declare query config`);
  }
  return createQuery({
    queryKey: manifest.queryKey(...args),
    queryFn: (): Promise<any> => manifest.queryFn!(...args),
    staleTime: manifest.staleTime,
    refetchInterval: manifest.refetchInterval,
  });
}

/**
 * Creates a refresh handler from a widget manifest.
 * ArgsGetter is called at refresh time to get the current args (avoids stale closures).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createWidgetRefresh(
  manifest: WidgetManifest,
  refetchFn: () => Promise<unknown>,
  getArgs: () => any[] = () => [],
) {
  if (!manifest.refreshFn || !manifest.queryKey) {
    throw new Error(`Manifest "${manifest.id}" does not declare refresh config`);
  }
  return createRefreshHandler(
    queryClient,
    () => manifest.refreshFn!(...getArgs()),
    () => manifest.queryKey!(...getArgs()),
    refetchFn,
  );
}
