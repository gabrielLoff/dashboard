import type { EndpointKey } from './endpoints';

export type WidgetZone = 'left' | 'carousel';

/**
 * A widget that fetches from the BFF. Names its Endpoint and declares both TTLs.
 */
export interface QueryWidget {
  id: string;
  component: unknown;
  zone?: WidgetZone;
  endpoint: EndpointKey;
  staleTime: number;
  refetchInterval: number;
}

/**
 * A widget backed by local state. Carries no wire configuration.
 */
export interface LocalWidget {
  id: string;
  component: unknown;
  zone?: WidgetZone;
}

/**
 * Declarative registration object per widget. Collected by widget-registry.
 *
 * The union distinguishes "this widget gets data from the wire" from
 * "this widget gets data from local state" — the compiler enforces that
 * a query-backed widget names its endpoint and both TTLs, and that a local
 * widget names neither.
 */
export type WidgetManifest = QueryWidget | LocalWidget;

export function isQueryWidget(manifest: WidgetManifest): manifest is QueryWidget {
  return 'endpoint' in manifest;
}
