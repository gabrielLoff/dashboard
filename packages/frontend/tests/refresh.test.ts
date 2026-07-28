import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from '@dashboard/shared';
import { createRefreshHandler } from '../src/lib/refresh.ts';

vi.mock('svelte-french-toast', () => ({
  default: { success: vi.fn() },
}));

import toast from 'svelte-french-toast';

function createMockQueryClient() {
  return {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createRefreshHandler', () => {
  it('calls refreshFn and sets query data on clear', async () => {
    const qc = createMockQueryClient();
    const refreshFn = vi.fn().mockResolvedValue(ok({ value: 42 }));
    const queryKeyFn = vi.fn().mockReturnValue(['test', 'key']);
    const refetchFn = vi.fn();

    const handler = createRefreshHandler(qc, refreshFn, queryKeyFn, refetchFn);
    await handler({ clear: true });

    expect(refreshFn).toHaveBeenCalledOnce();
    expect(qc.setQueryData).toHaveBeenCalledWith(['test', 'key'], { ok: true, data: { value: 42 } });
    expect(qc.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['test', 'key'] });
    expect(toast.success).toHaveBeenCalledWith('Cache cleared');
  });

  it('calls refetchFn when no clear option', async () => {
    const qc = createMockQueryClient();
    const refreshFn = vi.fn();
    const queryKeyFn = vi.fn();
    const refetchFn = vi.fn();

    const handler = createRefreshHandler(qc, refreshFn, queryKeyFn, refetchFn);
    await handler();

    expect(refetchFn).toHaveBeenCalledOnce();
    expect(refreshFn).not.toHaveBeenCalled();
  });

  it('does not set query data when refreshFn returns error', async () => {
    const qc = createMockQueryClient();
    const refreshFn = vi.fn().mockResolvedValue(err('API down'));
    const queryKeyFn = vi.fn().mockReturnValue(['test', 'key']);
    const refetchFn = vi.fn();

    const handler = createRefreshHandler(qc, refreshFn, queryKeyFn, refetchFn);
    await handler({ clear: true });

    expect(qc.setQueryData).not.toHaveBeenCalled();
    expect(qc.invalidateQueries).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('calls refetchFn when clear is false', async () => {
    const qc = createMockQueryClient();
    const refreshFn = vi.fn();
    const queryKeyFn = vi.fn();
    const refetchFn = vi.fn();

    const handler = createRefreshHandler(qc, refreshFn, queryKeyFn, refetchFn);
    await handler({ clear: false });

    expect(refetchFn).toHaveBeenCalledOnce();
    expect(refreshFn).not.toHaveBeenCalled();
  });

  it('passes arguments through to refreshFn', async () => {
    const qc = createMockQueryClient();
    const refreshFn = vi.fn().mockResolvedValue(ok(null));
    const queryKeyFn = vi.fn().mockReturnValue(['test']);
    const refetchFn = vi.fn();

    const handler = createRefreshHandler(qc, refreshFn, queryKeyFn, refetchFn);
    await handler({ clear: true });

    expect(refreshFn).toHaveBeenCalledOnce();
  });
});
