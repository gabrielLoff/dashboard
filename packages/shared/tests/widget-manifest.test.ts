import { describe, it, expectTypeOf } from 'vitest';
import type { WidgetManifest } from '../src/widget-manifest';
import type { ApiResult } from '../src/result';

describe('WidgetManifest', () => {
  it('accepts a query-based widget manifest', () => {
    const manifest: WidgetManifest = {
      id: 'weather',
      component: () => {},
      defaultLayout: { col: 0, row: 0, colSpan: 3, rowSpan: 3 },
      queryKey: (args?: { lat?: number; lon?: number }) => ['weather', args?.lat, args?.lon],
      queryFn: async (args?: { lat?: number; lon?: number }): Promise<ApiResult<unknown>> => {
        return { ok: true, data: { temperature: 20 } };
      },
      refreshFn: async (): Promise<ApiResult<unknown>> => ({ ok: true, data: null }),
      staleTime: 5 * 60 * 1000,
      refetchInterval: 10 * 60 * 1000,
    };

    expectTypeOf(manifest.id).toEqualTypeOf<string>();
    expectTypeOf(manifest.defaultLayout.col).toEqualTypeOf<number>();
  });

  it('accepts a local-only widget manifest (no query fields)', () => {
    const manifest: WidgetManifest = {
      id: 'habits',
      component: () => {},
      defaultLayout: { col: 3, row: 0, colSpan: 3, rowSpan: 2 },
    };

    expectTypeOf(manifest.queryKey).toEqualTypeOf<((...args: unknown[]) => readonly unknown[]) | undefined>();
    expectTypeOf(manifest.queryFn).toBeUndefined();
    expectTypeOf(manifest.staleTime).toBeUndefined();
  });

  it('has optional query fields', () => {
    expectTypeOf<WidgetManifest>().toHaveProperty('id');
    expectTypeOf<WidgetManifest>().toHaveProperty('component');
    expectTypeOf<WidgetManifest>().toHaveProperty('defaultLayout');
    expectTypeOf<WidgetManifest>().toHaveProperty('queryKey');
    expectTypeOf<WidgetManifest>().toHaveProperty('queryFn');
    expectTypeOf<WidgetManifest>().toHaveProperty('refreshFn');
    expectTypeOf<WidgetManifest>().toHaveProperty('staleTime');
    expectTypeOf<WidgetManifest>().toHaveProperty('refetchInterval');
  });
});
