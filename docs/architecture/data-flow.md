# Data Flow

## Request lifecycle

All server-backed widgets follow the same data flow. The architecture guarantees that one failing API never blocks the rest of the dashboard.

```mermaid
flowchart TD
    subgraph Widget["Widget (Svelte 5 component)"]
        Mount["onMount / reactive setup"]
        Query["useSourceQuery('weather')"]
        Derive["$derived(query.data)"]
    end

    subgraph TQ["TanStack Query"]
        CacheCheck{"Cached < staleTime?"}
        Return["return cached data"]
        BGRefetch["refetch in background"]
    end

    subgraph BFF["BFF Server"]
        Route["GET /api/weather"]
        CacheCheck2{"TTLCache hit?"}
        Return2["return cached"]
        Call["fetchWeather()"]
    end

    subgraph Connector["Connector"]
        MockCheck{"MOCK=true?"}
        Mock["return mock data"]
        Real["call external API"]
    end

    Mount --> Query --> CacheCheck
    CacheCheck -->|yes| Return
    CacheCheck -->|no| Route

    Return --> BGRefetch --> Route
    Return --> Derive

    Route --> CacheCheck2
    CacheCheck2 -->|yes| Return2 --> Derive
    CacheCheck2 -->|no| Call

    Call --> MockCheck
    MockCheck -->|yes| Mock --> Derive
    MockCheck -->|no| Real --> Derive
```

## Weather location resolution

The weather widget has a unique location resolution chain that runs before the query:

```mermaid
flowchart TD
    Mount["onMount"] --> Cache{"localStorage cache<br/>has coords?"}
    Cache -->|yes| Geo["Reverse geocode cached coords"]
    Cache -->|no| Browser["Browser Geolocation API"]

    Browser -->|granted| Geo
    Browser -->|denied| IP["IP-based geolocation<br/>(BigDataCloud)"]
    Browser -->|unavailable| IP

    Geo -->|success| Query["Query weather by coords"]
    Geo -->|failure| IP
    IP -->|city found| QueryCity["Query weather by city name"]
    IP -->|failure| Default["Default: Porto Alegre"]

    Query --> Render["Render widget"]
    QueryCity --> Render
    Default --> Render
```

Location is cached in localStorage for 7 days. The "Use my location" button re-triggers the full chain.

## Habits — client-side only

Habits skip the entire server layer. State lives in localStorage, managed by a reducer:

```mermaid
flowchart LR
    UI["HabitWidget.svelte"] --> Dispatch["habitStore.dispatch(action)"]
    Dispatch --> Reducer["habitReducer()"]
    Reducer --> State["new HabitState"]
    State --> Persist["localStorage"]
    State --> Derived["derived stores<br/>habits, habitCount, updatedAt"]
    Derived --> UI
```

No TanStack Query, no BFF, no network requests. The widget always renders instantly.

## Error propagation

All server layers use `ApiResult<T>` from `@dashboard/shared`. Errors propagate as values, not exceptions.

```mermaid
flowchart LR
    subgraph Server["Server"]
        Connector["connector"]
        Route2["route"]
    end

    subgraph Client["Frontend"]
        ApiClient["api-client.ts"]
        Query["TanStack Query"]
        Widget2["Widget.svelte"]
    end

    Connector -->|"ok(data) | err(msg)"| Route2
    Route2 -->|JSON body| ApiClient
    ApiClient -->|"ApiResult<T>"| Query
    Query -->|"query.data"| Widget2

    Widget2 -->|isOk?| Render["render data"]
    Widget2 -->|isErr?| ErrorState["show error + retry"]
```

### ApiResult type

```ts
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
```

The consumer pattern in every widget:

```svelte
<script lang="ts">
  const data = $derived(query.data);
</script>

{#if data && isOk(data)}
  <!-- render data.data -->
{:else if data && !isOk(data)}
  <!-- render data.error with retry button -->
{/if}
```

## Parallel loading

All six queries fire simultaneously on page load (habits resolves instantly from localStorage). TanStack Query handles request deduplication, so even if two widgets query the same source, only one request reaches the BFF.

```mermaid
gantt
    title Dashboard load timeline
    dateFormat X
    axisFormat %s

    section Weather widget
    Skeleton render       :a1, 0, 1
    Query fetch           :a2, 1, 5
    Data render           :a3, 5, 6

    section News widget
    Skeleton render       :b1, 0, 1
    Query fetch           :b2, 1, 8
    Data render           :b3, 8, 9

    section Agenda widget
    Skeleton render       :c1, 0, 1
    Query fetch           :c2, 1, 4
    Data render           :c3, 4, 5

    section Games widget
    Skeleton render       :d1, 0, 1
    Query fetch           :d2, 1, 3
    Data render           :d3, 3, 4

    section Habits widget
    Instant render        :e1, 0, 1
```

## Refresh triggers

| Trigger | Mechanism | Behavior |
|---|---|---|
| Page load | Initial render | Fires all 4 server queries in parallel; habits loads from localStorage |
| Window focus | `refetchOnWindowFocus: true` | Refetches only stale queries |
| Timer | `refetchInterval` per source | Polls time-sensitive sources (weather, agenda) |
| Manual | Refresh button per widget | Bypasses TanStack cache, hits BFF `/refresh` endpoint |
| Alt+click | Alt + refresh button | Clears BFF cache for that source, forces fresh fetch |

## Query configuration

Source query options (staleTime, refetchInterval, queryKey, queryFn) are defined in each widget's `manifest.ts` and collected by `widget-registry.ts`. The `useSourceQuery(name)` function in `query-config.ts` creates a TanStack Query with the right config, importing `sourceConfigs` from the registry. Weather has a special override in `query-config.ts` for coordinate-based queries.
