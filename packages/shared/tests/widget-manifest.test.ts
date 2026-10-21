import { describe, it, expect, expectTypeOf } from 'vitest';
import type { WidgetManifest, QueryWidget, LocalWidget } from '../src/widget-manifest';
import type { EndpointKey } from '../src/endpoints';

describe('WidgetManifest', () => {
  it('accepts a query-backed widget manifest', () => {
    const manifest: WidgetManifest = {
      id: 'weather',
      component: () => {},
      zone: 'left',
      endpoint: 'GET /api/weather',
      staleTime: 5 * 60 * 1000,
      refetchInterval: 10 * 60 * 1000,
    };

    expectTypeOf(manifest.id).toEqualTypeOf<string>();
    expectTypeOf(manifest).toMatchTypeOf<QueryWidget>();
  });

  it('accepts a local widget manifest (no endpoint, no TTLs)', () => {
    const manifest: WidgetManifest = {
      id: 'habits',
      component: () => {},
      zone: 'carousel',
    };

    expectTypeOf(manifest).toMatchTypeOf<LocalWidget>();
  });

  it('narrows to QueryWidget when endpoint is present', () => {
    const manifest: WidgetManifest = {
      id: 'news',
      component: () => {},
      endpoint: 'GET /api/news',
      staleTime: 1,
      refetchInterval: 2,
    };

    if ('endpoint' in manifest) {
      expectTypeOf(manifest.endpoint).toEqualTypeOf<EndpointKey>();
      expectTypeOf(manifest.staleTime).toEqualTypeOf<number>();
      expectTypeOf(manifest.refetchInterval).toEqualTypeOf<number>();
    }
  });

  it('requires endpoint to be a key of Endpoints', () => {
    const manifest: QueryWidget = {
      id: 'news',
      component: () => {},
      endpoint: 'GET /api/news',
      staleTime: 1,
      refetchInterval: 2,
    };

    expectTypeOf(manifest.endpoint).toEqualTypeOf<EndpointKey>();
  });

  it('rejects a query widget without TTLs', () => {
    // @ts-expect-error — staleTime and refetchInterval are required on QueryWidget
    const bad: QueryWidget = {
      id: 'news',
      component: () => {},
      endpoint: 'GET /api/news',
    };
    expect(bad).toBeDefined();
  });

  it('rejects a query widget without an endpoint', () => {
    // @ts-expect-error — endpoint is required on QueryWidget
    const bad: QueryWidget = {
      id: 'news',
      component: () => {},
      staleTime: 1,
      refetchInterval: 2,
    };
    expect(bad).toBeDefined();
  });

  it('rejects a local widget that declares an endpoint', () => {
    const bad = {
      id: 'habits',
      component: () => {},
      endpoint: 'GET /api/news',
    };
    // @ts-expect-error — LocalWidget does not carry endpoint
    const _m: LocalWidget = bad;
    expect(_m).toBeDefined();
  });

  it('rejects a local widget that declares TTLs', () => {
    const bad = {
      id: 'habits',
      component: () => {},
      staleTime: 1,
    };
    // @ts-expect-error — LocalWidget does not carry staleTime
    const _m: LocalWidget = bad;
    expect(_m).toBeDefined();
  });

  it('no longer declares defaultLayout, queryKey, queryFn, or refreshFn', () => {
    expectTypeOf<WidgetManifest>().not.toHaveProperty('defaultLayout');
    expectTypeOf<WidgetManifest>().not.toHaveProperty('queryKey');
    expectTypeOf<WidgetManifest>().not.toHaveProperty('queryFn');
    expectTypeOf<WidgetManifest>().not.toHaveProperty('refreshFn');
  });

  it('keeps id, component, and zone on both branches', () => {
    expectTypeOf<QueryWidget>().toHaveProperty('id');
    expectTypeOf<QueryWidget>().toHaveProperty('component');
    expectTypeOf<QueryWidget>().toHaveProperty('zone');
    expectTypeOf<LocalWidget>().toHaveProperty('id');
    expectTypeOf<LocalWidget>().toHaveProperty('component');
    expectTypeOf<LocalWidget>().toHaveProperty('zone');
  });
});
