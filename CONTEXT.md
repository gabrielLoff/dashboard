# Context

> _This file is the project's ubiquitous language and domain glossary. Add terms, concepts, and definitions as they emerge. See `docs/agents/domain.md` for consumer rules._

## Glossary

| Term | Definition |
|---|---|
| Widget | A self-contained dashboard panel that displays one data source (weather, news, agenda, games, shows) or local data (habits) |
| WidgetManifest | Declarative registration object per widget: id, component, query config, default layout. Collected by widget-registry. |
| BFF | Backend-for-Frontend server (Hono on port 3001) that proxies external APIs, normalizes responses, and caches |
| ApiResult<T> | Discriminated union `{ ok: true, data: T } \| { ok: false, error: string }` — the universal return type across all layers |
| Connector | Server-side module that fetches from an external API and normalizes to shared types |
| Source | A data provider (weather, news, agenda, games, shows, habits). Query-based sources have a manifest with queryKey/queryFn; habits is local-only. |
| WidgetLayout | Grid position for a widget: `{ col, row, colSpan, rowSpan }` in a 6-column CSS Grid |

## Architecture

- **Monorepo**: pnpm workspaces with 4 packages (`shared`, `server`, `frontend`, `eslint-config`)
- **Widget registry**: `widget-registry.ts` collects all widget manifests and exports COMPONENTS, sourceConfigs, WIDGET_IDS, DEFAULT_WIDGET_LAYOUTS
- **Two-layer caching**: BFF TTLCache (~2x frontend staleTime) + TanStack Query staleTime/refetchInterval
- **Composable controllers**: Drag and resize behavior extracted to `drag-controller.svelte.ts` and `resize-controller.svelte.ts`
- **App.svelte**: Thin orchestrator (~136 lines) — imports from registry, composes controllers, renders grid
