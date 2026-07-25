# Dashboard Architecture

## Overview

Monorepo with three packages sharing a TypeScript type layer. The **frontend** (Svelte 5 + Vite) renders four independent widgets. The **BFF server** (Hono) proxies external APIs, normalizes responses, and caches. The **shared** package defines the type contract between them.

```mermaid
graph TD
    subgraph Frontend["Frontend (Vite :5173)"]
        direction TB
        A["App.svelte<br/>CSS Grid Layout"]
        W1["WeatherWidget"]
        W2["NewsWidget"]
        W3["AgendaWidget"]
        W4["GamesWidget"]
        TQ["TanStack Query<br/>Cache Layer"]
        API["api-client.ts<br/>fetch wrapper"]
    end

    subgraph BFF["BFF Server (Hono :3001)"]
        direction TB
        R1["/api/weather"]
        R2["/api/news"]
        R3["/api/agenda"]
        R4["/api/games"]
        Cache["TTLCache&lt;T&gt;<br/>per-source TTL"]
        C1["weather connector"]
        C2["news connector"]
        C3["agenda connector"]
        C4["games connector"]
    end

    subgraph External["External APIs"]
        E1["OpenWeatherMap"]
        E2["News API"]
        E3["Google Calendar"]
        E4["Free Games API"]
    end

    A --> W1 --> TQ --> API
    A --> W2 --> TQ --> API
    A --> W3 --> TQ --> API
    A --> W4 --> TQ --> API

    API -->|"HTTP /api/*"| BFF

    R1 --> Cache --> C1 --> E1
    R2 --> Cache --> C2 --> E2
    R3 --> Cache --> C3 --> E3
    R4 --> Cache --> C4 --> E4
```

## Package Structure

```
dashboard/
├── packages/
│   ├── shared/              # @dashboard/shared
│   │   └── src/
│   │       ├── result.ts    # ApiResult<T>, ok(), err(), isOk(), isErr()
│   │       ├── api-types.ts # WeatherData, NewsData, AgendaData, FreeGamesData
│   │       └── query-keys.ts # TanStack Query key factories
│   │
│   ├── eslint-config/       # @dashboard/eslint-config
│   │   ├── index.mjs        # Base TS strict config
│   │   └── svelte.mjs       # Base + Svelte rules
│   │
│   ├── server/              # Hono BFF
│   │   └── src/
│   │       ├── index.ts     # App entry, CORS, route mounting
│   │       ├── cache.ts     # TTLCache<T> in-memory with configurable expiration
│   │       ├── mock-data.ts # Mock fixtures, gated by MOCK=true env
│   │       ├── routes/      # Hono route handlers per domain
│   │       └── connectors/  # External API adapters (one per source)
│   │
│   └── frontend/            # Svelte 5 + Vite
│       └── src/
│           ├── App.svelte           # Root layout, theme init, QueryClientProvider
│           ├── main.ts              # App mount + global CSS
│           ├── app.css              # Tailwind v4 + dark variant
│           ├── lib/
│           │   ├── api-client.ts    # Centralized HTTP client
│           │   ├── query-client.ts  # TanStack QueryClient config
│           │   ├── theme.svelte.ts  # Dark/light theme store (Svelte runes)
│           │   └── utils.ts         # cn() helper (clsx + tailwind-merge)
│           ├── components/
│           │   ├── WidgetCard.svelte  # Widget shell: header, spinner, error, refresh
│           │   └── ThemeToggle.svelte # Dark/light toggle button
│           └── widgets/
│               ├── weather/  # WeatherWidget + useWeatherQuery
│               ├── news/     # NewsWidget + useNewsQuery
│               ├── agenda/   # AgendaWidget + useAgendaQuery
│               └── games/    # GamesWidget + useGamesQuery
```

## Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Monorepo | pnpm workspaces | Single install, shared types, single dev command |
| Types | ApiResult&lt;T&gt; discriminated union | Forces error handling at every level, TypeScript exhaustiveness |
| BFF cache | per-source TTL (2x frontend staleTime) | Safety net under TanStack Query without rate-limit risk |
| Mock data | `MOCK=true` env gate | Works immediately out of the box, connectors are real code |
| Widget contract | &lt;WidgetCard&gt; wrapper with slots | Consistent shell, widgets only render their data |
| Theme | Dark/light via CSS class on &lt;html&gt; | Tailwind v4 `dark:` variant, persisted to localStorage |
| Dev experience | `pnpm dev` → concurrently runs both | Single command, Vite proxy avoids CORS |

## Caching Strategy

```mermaid
sequenceDiagram
    participant Browser
    participant TanStackQuery as TanStack Query
    participant BFF as BFF Server
    participant TTLCache as TTLCache
    participant API as External API

    Browser->>TanStackQuery: Component mounts, needs weather data
    TanStackQuery->>BFF: GET /api/weather
    
    BFF->>TTLCache: get('weather')
    
    alt Cache hit & fresh
        TTLCache-->>BFF: cached data
        BFF-->>TanStackQuery: { ok: true, data }
    else Cache miss or expired
        BFF->>API: fetch weather
        API-->>BFF: raw response
        BFF->>BFF: normalize to WeatherData
        BFF->>TTLCache: set('weather', data, ttl)
        BFF-->>TanStackQuery: { ok: true, data }
    end
    
    TanStackQuery->>TanStackQuery: cache by queryKey
    TanStackQuery-->>Browser: render widget
    
    Note over TanStackQuery: 5min later, onWindowFocus
    TanStackQuery->>BFF: GET /api/weather (stale query)
    BFF->>TTLCache: get('weather')
    Note over TTLCache: Still fresh (10min TTL)
    TTLCache-->>BFF: cached data
    BFF-->>TanStackQuery: { ok: true, data }
```

## Refresh TTLs

| Source | Frontend staleTime | Frontend refetchInterval | BFF cache TTL |
|---|---|---|---|
| Weather | 5 min | 10 min | 10 min |
| News | 15 min | 30 min | 30 min |
| Agenda | 5 min | 10 min | 10 min |
| Games | 60 min | 2 hours | 2 hours |
