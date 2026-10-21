# Context

> _This file is the project's ubiquitous language and domain glossary. Add terms, concepts, and definitions as they emerge. See `docs/agents/domain.md` for consumer rules._

## Glossary

| Term | Definition |
|---|---|
| Widget | A self-contained dashboard panel that displays one data source (weather, news, agenda, games, shows) or local data (habits) |
| WidgetManifest | Declarative registration object per widget. A discriminated union: a **query-backed** manifest names an Endpoint plus its TTLs; a **local** manifest names neither. Collected by widget-registry. |
| Endpoint | The wire contract for one verb + path on the BFF — input shape, response shape, cache identity, and optionally a paired cache-bust endpoint. The verb+path *is* the Endpoint's name. |
| Cache-bust | The paired Endpoint that invalidates the BFF cache entry for a read Endpoint and re-fetches. Not every Endpoint has one — writes and uncacheable reads don't. |
| BFF | Backend-for-Frontend server (Hono on port 3001) that proxies external APIs, normalizes responses, and caches |
| ApiResult<T> | Discriminated union `{ ok: true, data: T } \| { ok: false, error: string }` — the universal return type across all layers. Crossing into the BFF always produces one; it never throws. |
| Connector | Server-side module that fetches from an external API and normalizes to shared types |
| Source | A data provider (weather, news, agenda, games, shows, habits). Query-based sources are declared by an Endpoint; habits is local-only. |
| WidgetZone | Widget placement zone: `'left'` (fixed left column) or `'carousel'` (in the right column carousel) |
| Carousel | Navigation component with icon tabs, swipe/scroll support, and slide animation. Displays one widget at a time. |

## Architecture

- **Monorepo**: pnpm workspaces with 4 packages (`shared`, `server`, `frontend`, `eslint-config`)
- **Widget registry**: `widget-registry.ts` collects all widget manifests and exports COMPONENTS, WIDGET_IDS, CAROUSEL_ITEMS, LEFT_WIDGET_IDS, CAROUSEL_WIDGET_IDS
- **Endpoint contract**: `packages/shared/src/endpoints.ts` defines `Endpoints` (keys are `verb + path`) and `ENDPOINT_META` (cache identity per endpoint). `request(key, input)` is the only way the frontend crosses into the BFF — it never throws.
- **Two-layer caching**: BFF TTLCache (~2x frontend staleTime) + TanStack Query staleTime/refetchInterval
- **Two-column layout**: Fixed 40/60 split on desktop. Left column: weather + agenda. Right column: carousel with swipe/tabs.
- **App.svelte**: Orchestrates two-column layout, imports from registry, renders widgets
