# Best Technologies and Architecture Practices for a Local Dashboard with Multiple API Connections

## Summary

For a local-first dashboard aggregating weather, newsletters, agenda, and free games APIs, **Svelte 5 + Vite + TanStack Query** offers the best bundle-size-to-capability ratio, with **Hono** (or **Express.js**) as a thin server-side aggregation layer that proxies external APIs and keeps API keys off the client. Use **Recharts** or **Apache ECharts** for charting, **Tailwind CSS + shadcn-svelte** for UI, and separate server state (TanStack Query) from UI state (Svelte runes/local stores). For an optional native desktop wrapper, **Tauri v2** provides a <5MB bundle using the system WebView instead of Chromium.

---

## Findings

### Server state and client state must be separated into different tools
Mixing fetched data (server state) with UI state (client state) in a single store is the most common architectural anti-pattern in dashboards. It causes stale data bugs, manual cache invalidation, and loading-state spaghetti. Modern best practice: use TanStack Query/SWR for server state and a lightweight store (Zustand, Jotai, Svelte stores) for UI state.

**Source:** [JS Guide — Data Layer Architecture](https://www.jsguide.dev/topic/data-layer-architecture) — "Client state (UI, forms, navigation) is owned by the browser; server state (fetched data) is a cached copy of backend data — mixing them in one store causes stale data bugs and manual cache management."

### TanStack Query dominates server-state management for dashboards in 2026
TanStack Query v5 reaches 12.3M weekly npm downloads (~2.5x SWR's 4.85M). It provides DevTools, first-class `useMutation`, `useSuspenseQueries` for parallel waterfall-free fetching, and framework-agnostic support (React, Vue, Svelte, Solid). SWR is lighter (4.2KB vs 13.4KB gzipped) and better for simple read-heavy dashboards, but TanStack Query is the safer long-term choice for multi-source data.

**Source:** [toolchew — TanStack Query vs SWR 2026](https://toolchew.com/en/tanstack-query-vs-swr/) — "TanStack Query downloads hit 12.3 million/week in May 2026, roughly 2.5x SWR's 4.85 million/week. That gap has widened year over year since 2024."

### staleTime must be configured per data source — the default of 0ms is wasteful
TanStack Query defaults `staleTime: 0`, which means every component mount fires a network request. For a dashboard hitting multiple APIs, this causes request storms. Each data source should have a `staleTime` matching its freshness requirements: weather ~5-10min, newsletters ~5-30min, agenda ~5min, free games ~30min-24h.

**Source:** [Code With Seb — Advanced Caching Strategies with TanStack Query](https://www.codewithseb.com/blog/tanstack-query-advanced-caching-rsc-guide) — "Why change staleTime from 0? The default of 0ms means every component mount triggers a background refetch. For most data (user profiles, product lists, dashboard metrics), this is wasteful. 60 seconds of staleness is acceptable and dramatically reduces API calls."

### A Backend-for-Frontend (BFF) layer is the recommended pattern for aggregating multiple APIs
Instead of the browser calling weather, newsletter, agenda, and games APIs directly (exposing API keys, creating CORS issues, and causing waterfall requests), a thin BFF server aggregates all external API calls server-side and returns pre-shaped responses to the frontend. This is especially critical for a local dashboard where API keys must stay on the server, never in client-side code.

**Source:** [JS Guide — Data Layer Architecture](https://www.jsguide.dev/topic/data-layer-architecture) — "A BFF is a thin server layer that aggregates multiple backend APIs into frontend-optimized endpoints. Instead of the client making 5 separate API calls to assemble a page, the BFF makes those calls server-side and returns a single, pre-shaped response."

### Recharts is the default choice for React dashboards; ECharts for data-heavy or multi-framework dashboards
Recharts has 3.6M weekly downloads, a composable React-component API, and is the chart library behind shadcn/ui's chart components. Apache ECharts (64K GitHub stars, Canvas/SVG dual rendering) handles 100K+ data points smoothly and supports heatmaps, Sankey, radar, treemap, and Gauge charts natively. For Svelte dashboards, ECharts (through a wrapper) or LayerCake are the top choices.

**Source:** [LogRocket — Best React Chart Libraries 2026](https://blog.logrocket.com/best-react-chart-libraries-2026/) — "For most React dashboards, Recharts is the safest default. It has strong ecosystem adoption, a straightforward component API, SVG rendering, and good compatibility with common React UI stacks like shadcn/ui."

### Svelte 5 + SvelteKit is the most bundle-efficient full-stack option for a local dashboard
Svelte compiles away the framework at build time, resulting in smaller bundles than React. For a local dashboard — where SEO is irrelevant, no server-rendering for multi-user access is needed, and bundle size directly impacts startup time — Svelte 5 with runes ($state, $derived, $effect) avoids the virtual DOM overhead of React. Projects like **liteda** and **Lantern** demonstrate SvelteKit-based homelab dashboards with 50-80MB RAM and YAML config.

**Source:** [liteda (GitHub)](https://github.com/saweima12/liteda) — "~50-80MB base memory, ~100MB during active polling. SvelteKit SSR with smart caching (default 10s TTL). YAML files + Markdown pages, no database needed."

### Tauri v2 is the right choice for a native desktop wrapper; Electron is overkill for a dashboard
Tauri compiles to ~5MB installers (vs Electron's ~150MB) by using the OS-native WebView. The frontend runs in the WebView; the Rust backend handles native OS integration (system tray, notifications, file system, auto-updates). For a local dashboard that primarily displays web data, a web-only approach (browser tab or PWA) is sufficient; Tauri adds value only if native features are needed.

**Source:** [OpenAdmin (GitHub)](https://github.com/dhia-bechattaoui/openadmin) — "We explicitly chose Tauri over Electron because it uses the native OS webview, keeping the application bundle tiny (~5MB) and idle RAM usage exceptionally low. The local embedded SQLite database ensures that your sensitive data never leaves your device."

---

## Technology Recommendations

### Frontend Framework

**Recommendation: Svelte 5 + Vite (primary) or React 19 + Vite (if team is React-native).**

Svelte 5's runes API ($state, $derived, $effect) and compile-step elimination of the virtual DOM make it ideal for a local dashboard where bundle size and startup speed matter more than ecosystem breadth. React 19 with Vite is the safer pick if the team already knows React or needs access to a broader component ecosystem (shadcn/ui, Recharts, TanStack Table).

Avoid Next.js for a purely local dashboard — its App Router, RSC, and SSR features add complexity without benefit when there's no deployment server. A plain Vite setup (Svelte or React) with a separate lightweight API server is the right separation of concerns.

**Sources:** [liteda](https://github.com/saweima12/liteda), [Lantern](https://github.com/bobbydd021-code/Lantern), [Data Layer Architecture](https://www.jsguide.dev/topic/data-layer-architecture)

### State Management & Caching

**Recommendation: TanStack Query for server state + Svelte stores (or Zustand/Jotai for React) for UI state.**

TanStack Query handles all async data from external APIs: caching, deduplication, background refetch, polling intervals, and stale-while-revalidate behavior. Each API source gets its own `staleTime` and `refetchInterval`:

| Data Source | staleTime | refetchInterval | Rationale |
|---|---|---|---|
| Weather | 5-10 min | 10-30 min | Weather changes slowly |
| Newsletters | 5-30 min | 15-60 min | Email digests are low-frequency |
| Agenda | 1-5 min | 5-15 min | Calendar events may change |
| Free Games | 30 min - 24h | 1-24h | Promotions change daily at most |

UI state (filter selections, active tab, sidebar collapsed, theme) stays in lightweight Svelte stores or React's Zustand/Jotai.

**Sources:** [Khalil Ahmed — Dashboard Architecture](https://www.khalilahmed.dev/blog/frontend-architecture-data-heavy-dashboards), [toolchew — TanStack Query vs SWR](https://toolchew.com/en/tanstack-query-vs-swr/), [DEV — Stop Wasting Renders](https://dev.to/codewithamrendra/stop-wasting-renders-how-to-handle-complex-rest-apis-in-your-frontend-37fk)

### API Integration Pattern

**Recommendation: Service layer abstraction + thin BFF server (Hono or Express.js).**

Architecture:
```
[Browser UI]  ←→  [BFF Server :3001]  ←→  [External APIs]
                    ├─ /api/weather    →  OpenWeatherMap
                    ├─ /api/news       →  Newsletter API
                    ├─ /api/agenda     →  Calendar API
                    └─ /api/games      →  Free Games API
```

The BFF server:
1. Stores API keys in environment variables (never exposed to the browser)
2. Fetches from all external APIs in parallel server-side
3. Normalizes responses into a consistent format
4. Caches responses with configurable TTL (using an in-memory Map or optional Redis)
5. Returns pre-shaped JSON to the frontend

On the frontend, a centralized service layer (`services/api.ts` or `lib/api-client.ts`) wraps all HTTP calls. Components and hooks call service functions, never `fetch()` directly. This pattern is consistently recommended across production dashboard architectures.

**Sources:** [Khalil Ahmed — Dashboard Architecture](https://www.khalilahmed.dev/blog/frontend-architecture-data-heavy-dashboards), [JS Guide — BFF Pattern](https://www.jsguide.dev/topic/data-layer-architecture), [DEV — Managing Multiple APIs](https://dev.to/skniyaznoor/managing-multiple-apis-and-databases-in-a-single-frontend-using-redux-1ml)

### Backend / BFF Layer

**Recommendation: Hono (lightweight) or Express.js (mature) running on Node.js. For Python-oriented teams: FastAPI.**

Hono is the modernized choice: faster cold starts, better edge support, cleaner API, and works with Bun for additional speed. Express.js is the battle-tested alternative with the largest middleware ecosystem. Both can serve as the BFF:

- Expose REST endpoints that aggregate external API data
- Implement in-memory caching (Map with TTL) or optional Redis
- Handle polling orchestration (server polls external APIs on a schedule, caches results, serves latest cached copy to frontend)
- Keep API keys in environment variables

If the dashboard will always be local and never deployed, you can also use the Vite dev server's proxy feature for a zero-backend approach — but this leaves API keys in the Vite config, which is acceptable only for purely local, single-user use.

**Sources:** [Modern SaaS Tech Stack 2026](https://outplane.com/blog/saas-tech-stack-2026), [Complete API Stack 2026](https://apiscout.dev/guides/complete-api-stack-modern-web-app-2026)

### Dashboard-Specific Libraries

| Concern | Recommendation | Rationale |
|---|---|---|
| Charts | **Recharts** (React) or **Apache ECharts** (framework-agnostic) | Recharts for simple dashboards, ECharts for data-heavy or multi-chart-type needs |
| Tables | **TanStack Table** | Headless, framework-agnostic, supports sorting, filtering, pagination, virtualization |
| UI Components | **shadcn/ui** (React) or **shadcn-svelte** (Svelte) | Copy-paste components, no dependency lock-in, Tailwind-based |
| Styling | **Tailwind CSS** | Industry standard for dashboard styling in 2026 |
| Virtualization | **TanStack Virtual** | DOM virtualization for lists and tables over 100 rows |
| Layout | **CSS Grid** + responsive breakpoints | Native, no library needed for dashboard grid layout |

**Sources:** [LogRocket — Best React Chart Libraries 2026](https://blog.logrocket.com/best-react-chart-libraries-2026/), [reacts.dev — Recharts vs Nivo vs ECharts](https://reacts.dev/how-to-choose-a-react-charting-library-recharts-vs-nivo-vs-echarts-vs-victory), [Khalil Ahmed — Dashboard Architecture](https://www.khalilahmed.dev/blog/frontend-architecture-data-heavy-dashboards)

---

## Architecture Overview

### High-level architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Vite)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Weather  │  │ News     │  │ Agenda   │  │ Games  │ │
│  │ Widget   │  │ Widget   │  │ Widget   │  │ Widget │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │
│       │             │             │             │       │
│  ┌────┴─────────────┴─────────────┴─────────────┴────┐  │
│  │              TanStack Query Cache                 │  │
│  │  (staleTime per source, background refetch)       │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │                               │
│  ┌──────────────────────┴───────────────────────────┐  │
│  │           Service Layer (api-client.ts)           │  │
│  │  getWeather(), getNews(), getAgenda(), getGames() │  │
│  └──────────────────────┬───────────────────────────┘  │
└─────────────────────────┼──────────────────────────────┘
                          │ HTTP (localhost)
┌─────────────────────────┼──────────────────────────────┐
│              BFF SERVER (Hono / Express)                │
│  ┌──────────────────────┴───────────────────────────┐  │
│  │          API Routes (server-side)                 │  │
│  │  GET /api/weather   GET /api/news                 │  │
│  │  GET /api/agenda    GET /api/games                │  │
│  └────┬──────────┬──────────┬──────────┬────────────┘  │
│       │          │          │          │                │
│  ┌────┴──────────┴──────────┴──────────┴────────────┐  │
│  │        In-Memory Cache (Map + TTL)                │  │
│  │        weather → { data, cachedAt }               │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │         API Connectors (server-side)              │   │
│  │  src/connectors/weather.ts → OpenWeatherMap       │   │
│  │  src/connectors/news.ts    → Newsletter API       │   │
│  │  src/connectors/agenda.ts  → Calendar API         │   │
│  │  src/connectors/games.ts   → Free Games API       │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Environment (.env) — API keys never hit browser  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Data flow

1. **On page load:** Frontend renders skeleton placeholders for each widget. TanStack Query fires parallel requests to the BFF server (via service layer) for all four data sources simultaneously — no waterfalls.

2. **BFF processing:** The server checks its in-memory cache for each request. If cache is fresh (within TTL), returns cached data immediately. If stale/missing, fetches from the external API, normalizes the response, caches it, and returns the result.

3. **Rendering:** TanStack Query delivers data to each widget component. Each widget is wrapped in its own Suspense/error boundary — if the weather API is slow, the news widget still renders immediately.

4. **Background refresh:** TanStack Query handles revalidation based on per-source `staleTime`:
   - On window focus, stale data is silently refetched in the background
   - `refetchInterval` polls on a timer for time-sensitive sources (weather every 10min)
   - Manual refresh button bypasses cache and forces a refetch

5. **Error handling:** Each widget shows its own error state with a retry button. One failing API does not block the rest of the dashboard. TanStack Query's built-in retry logic (3 retries with exponential backoff) handles transient failures.

### Polling / Refresh strategy

| Strategy | Use case |
|---|---|
| `staleTime` + `refetchOnWindowFocus` | Default for all sources — refetch stale data on focus |
| `refetchInterval` (timer-based) | Weather, agenda — predictable update cadence |
| Manual refresh button | Per-widget or global — user-triggered full refresh |
| SSE / EventSource (future) | If any API supports push notifications |

### Folder structure

```
project/
├── frontend/                    # Vite + Svelte (or React)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api-client.ts    # Centralized HTTP client
│   │   │   ├── query-keys.ts    # TanStack Query key factories
│   │   │   └── cache-config.ts  # staleTime/gcTime per source
│   │   ├── widgets/
│   │   │   ├── weather/
│   │   │   │   ├── WeatherWidget.svelte
│   │   │   │   ├── weather-api.ts    # Service functions
│   │   │   │   └── weather-types.ts
│   │   │   ├── news/
│   │   │   ├── agenda/
│   │   │   └── games/
│   │   ├── components/ui/       # Shared primitives
│   │   └── App.svelte
│   └── vite.config.ts
├── server/                      # Hono / Express BFF
│   ├── src/
│   │   ├── routes/
│   │   │   ├── weather.ts
│   │   │   ├── news.ts
│   │   │   ├── agenda.ts
│   │   │   └── games.ts
│   │   ├── connectors/          # External API adapters
│   │   ├── cache.ts             # In-memory TTL cache
│   │   └── index.ts
│   └── .env                     # API keys (gitignored)
└── package.json
```

### Running locally

```bash
# Terminal 1: Start the BFF server
cd server && npm run dev    # localhost:3001

# Terminal 2: Start the frontend dev server
cd frontend && npm run dev  # localhost:5173, proxies /api → :3001
```

Open `http://localhost:5173` in the browser. No deployment, no cloud, no Docker. Purely local.

---

## Sources

- [JS Guide — Data Layer Architecture](https://www.jsguide.dev/topic/data-layer-architecture)
- [Khalil Ahmed — Frontend Architecture for Data-Heavy Dashboards](https://www.khalilahmed.dev/blog/frontend-architecture-data-heavy-dashboards)
- [toolchew — TanStack Query vs SWR 2026](https://toolchew.com/en/tanstack-query-vs-swr/)
- [Code With Seb — Advanced Caching with TanStack Query](https://www.codewithseb.com/blog/tanstack-query-advanced-caching-rsc-guide)
- [DEV — Stop Wasting Renders: REST API Optimization](https://dev.to/codewithamrendra/stop-wasting-renders-how-to-handle-complex-rest-apis-in-your-frontend-37fk)
- [DEV — Managing Multiple APIs and Databases in a Single Frontend](https://dev.to/skniyaznoor/managing-multiple-apis-and-databases-in-a-single-frontend-using-redux-1ml)
- [LogRocket — Best React Chart Libraries 2026](https://blog.logrocket.com/best-react-chart-libraries-2026/)
- [reacts.dev — Recharts vs Nivo vs ECharts vs Victory](https://reacts.dev/how-to-choose-a-react-charting-library-recharts-vs-nivo-vs-echarts-vs-victory)
- [Youngju.dev — Web Data Visualization Libraries 2026](https://www.youngju.dev/blog/culture/2026-05-14-data-visualization-libraries-2026-d3-plot-visx-recharts-echarts-vega-comparison-deep-dive-2026.en)
- [liteda — SvelteKit Homelab Dashboard](https://github.com/saweima12/liteda)
- [Lantern — SvelteKit Real-Time Dashboard](https://github.com/bobbydd021-code/Lantern)
- [OpenAdmin — Tauri Local-First Dashboard](https://github.com/dhia-bechattaoui/openadmin)
- [Tauri Patterns — SQLite + Migrations](https://www.codegiz.com/blog/tauri-patterns-episode-6-add-sqlite-migrations-to-tauri-2/)
- [Smashing Magazine — Architecture of Local-First Web Development](https://www.smashingmagazine.com/2026/05/architecture-local-first-web-development/)
- [Modern SaaS Tech Stack 2026](https://outplane.com/blog/saas-tech-stack-2026)
- [Complete API Stack for Modern Web App 2026](https://apiscout.dev/guides/complete-api-stack-modern-web-app-2026)
- [Stackademic — System Design for Frontend Engineers: Scalable Dashboard](https://blog.stackademic.com/system-design-for-frontend-engineers-building-a-scalable-dashboard-5de2966334f4)
- [SquareGPS — SQL Report Dashboard Architecture](https://github.com/SquareGPS/navixy-iot-query-dashboard/blob/main/docs/ARCHITECTURE.md)
- [DEV — Real-Time Dashboard with Kafka, Socket.IO, and BFF](https://dev.to/kaustubhalandkar/how-i-designed-a-real-time-dashboard-using-kafka-socketio-and-a-bff-4b8m)
- [HTMX Documentation — Polling & SSE](https://htmx.org/docs/)
- [htmnx SSE Extension](https://htmx.org/extensions/sse/)
