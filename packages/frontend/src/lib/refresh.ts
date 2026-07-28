import type { QueryClient } from '@tanstack/svelte-query';
import { isOk } from '@dashboard/shared';
import type { ApiResult } from '@dashboard/shared';
import toast from 'svelte-french-toast';

type RefreshFn<T> = (...args: unknown[]) => Promise<ApiResult<T>>;
type QueryKeyFn = () => readonly unknown[];

export function createRefreshHandler<T>(
  queryClient: QueryClient,
  refreshFn: RefreshFn<T>,
  queryKeyFn: QueryKeyFn,
  refetchFn: () => Promise<unknown>,
) {
  return async (opts?: { clear?: boolean }) => {
    if (opts?.clear) {
      const result = await refreshFn();
      if (isOk(result)) {
        const key = queryKeyFn();
        queryClient.setQueryData(key as string[], result);
        await queryClient.invalidateQueries({ queryKey: key as string[] });
        toast.success('Cache cleared');
      }
    } else {
      await refetchFn();
    }
  };
}
