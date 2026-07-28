# Widget Lifecycle & Component Contract

## Widget states

Every server-backed widget passes through four states. The `<WidgetCard>` wrapper handles the shell; the widget content handles the data display. Habits is always instant (no loading state).

```mermaid
stateDiagram-v2
    [*] --> Loading: Component mounts
    Loading --> Data: Query resolves (ok)
    Loading --> Error: Query resolves (err)
    Loading --> Error: Network failure / timeout
    Data --> Refetching: refetchOnWindowFocus
    Data --> Refetching: refetchInterval fires
    Data --> Refetching: user clicks refresh
    Refetching --> Data: refetch succeeds
    Refetching --> Refetching: data stays stale-while-revalidate
    Error --> Loading: user clicks retry
```

## WidgetCard contract

```
┌──────────────────────────────────────┐
│  [drag] [expand] [icon] Title [refresh] │  ← header: always visible
├──────────────────────────────────────┤
│                                      │
│  [loading]    spinner centered       │  ← isLoading = true
│                                      │
│  ── OR ──                            │
│                                      │
│  [error]      error msg + retry btn  │  ← error != ''
│                                      │
│  ── OR ──                            │
│                                      │
│  [data]       children rendered      │  ← children snippet
│              [bg-spinner]            │  ← isFetching indicator
│              [updated X ago]         │  ← updatedAt timestamp
│                                      │
└──────────────────────────────────────┘
```

### Props

```ts
interface WidgetCardProps {
  title: string;              // Widget title in the header
  icon?: Snippet;             // Icon slot in the header (Lucide icon)
  isLoading: boolean;         // Full spinner overlay, hides children
  isFetching: boolean;        // Subtle background refetch indicator
  error: string;              // Error message, shows retry UI when set
  onRefresh: (opts?: { clear?: boolean }) => void;  // Header refresh button; Alt+click passes { clear: true }
  children: Snippet;          // The widget's data content
  updatedAt?: string;         // ISO timestamp, shows "Updated X ago"
  size?: 'compact' | 'wide';  // Widget width in the grid
  onToggleSize?: () => void;  // Toggles between compact and wide
  dragHandle?: Snippet;       // Drag handle for reordering
  class?: string;             // Extra classes for the outer card
}
```

### Usage pattern

```svelte
<script lang="ts">
  const query = useSourceQuery('weather');
  const data = $derived(query.data);
  const error = $derived(data && !isOk(data) ? data.error : '');
</script>

<WidgetCard
  title="Weather"
  isLoading={query.isLoading}
  isFetching={query.isFetching}
  error={error}
  onRefresh={handleRefresh}
  updatedAt={updatedAt}
  {size}
  {onToggleSize}
>
  {#snippet icon()}
    <CloudSun class="h-4 w-4" />
  {/snippet}
  {#snippet dragHandle()}
    <GripVertical class="h-4 w-4" />
  {/snippet}
  {#snippet children()}
    {#if data && isOk(data)}
      <!-- render data.data -->
    {/if}
  {/snippet}
</WidgetCard>
```

## Layout system

Widgets live in a CSS Grid managed by `svelte-dnd-action`. Each widget can be reordered by dragging and toggled between compact (half-width) and wide (full-width).

```mermaid
flowchart TD
    App["App.svelte"] --> LayoutStore["layoutStore<br/>(localStorage)"]
    LayoutStore --> Order["order: string[]<br/>default: weather,news,agenda,games,habits"]
    LayoutStore --> Sizes["widgets: Record<id, size>"]

    App --> DnD["svelte-dnd-action<br/>drag to reorder"]
    App --> Grid["CSS Grid<br/>grid-cols-1 lg:grid-cols-2"]

    Grid --> W1["weather<br/>compact → 1 col"]
    Grid --> W2["news<br/>compact → 1 col"]
    Grid --> W3["agenda<br/>wide → 2 cols"]
    Grid --> W4["games<br/>compact → 1 col"]
    Grid --> W5["habits<br/>compact → 1 col"]
```

### Key files

- `layout-store.ts` — Svelte store with `toggleSize(id)`, `reorder(newOrder)`, `getSize(id)`, `getOrder()`. Persisted to localStorage.
- `App.svelte` — Maps `layout.order` to components via `COMPONENTS` record, wraps each in a `<div>` with conditional `lg:col-span-2` for wide widgets.

## Adding a new widget

1. Define the API type in `packages/shared/src/api-types.ts`
2. Add a query key in `packages/shared/src/query-keys.ts`
3. Create a connector in `packages/server/src/connectors/`
4. Add mock data in `packages/server/src/mock-data.ts`
5. Create a route in `packages/server/src/routes/`
6. Mount the route in `packages/server/src/index.ts`
7. Add fetch functions in `packages/frontend/src/lib/api-client.ts`
8. Add source config (staleTime, refetchInterval) in `packages/frontend/src/lib/query-config.ts`
9. Create `packages/frontend/src/widgets/<name>/` with `<Name>Widget.svelte`
10. Add to `WIDGET_IDS` array in `packages/frontend/src/lib/layout-store.ts`
11. Add to `COMPONENTS` map in `packages/frontend/src/App.svelte`

### Client-only widgets (no server)

For widgets that don't need server data (like Habits), skip steps 1–7. Instead:

1. Create a Svelte store in `packages/frontend/src/lib/` with localStorage persistence
2. Create the widget component in `packages/frontend/src/widgets/<name>/`
3. Add to `WIDGET_IDS` and `COMPONENTS`
4. Pass `isLoading={false}` and `isFetching={false}` to WidgetCard

## Testing per widget

| Layer | What to test | Tool | Example |
|---|---|---|---|
| `shared/result.ts` | ok/err construction, isOk/isErr narrowing, unwrap | Vitest | `tests/result.test.ts` |
| `server/cache.ts` | TTL expiry, get/set/delete/clear, per-entry TTL | Vitest | `tests/cache.test.ts` |
| `server/connectors/*` | Normalization logic with mock data | Vitest (future) | Skip in boilerplate |
| Frontend widgets | Visual inspection during dev | Manual | Run dev server |

## Theme

```mermaid
flowchart TD
    Init["App.svelte onMount"] --> Read["read localStorage('dashboard-theme')"]
    Read -->|found| UseStored["use stored value"]
    Read -->|not found| UsePref["use prefers-color-scheme"]
    UseStored --> Apply["toggle .dark on <html>"]
    UsePref --> Apply

    Toggle["ThemeToggle click"] --> Flip["flip light ↔ dark"]
    Flip --> Save["write to localStorage"]
    Save --> Apply
```

The theme is applied via a CSS class on `<html>`. Tailwind v4's `@custom-variant dark` declaration enables `dark:` prefix variants. The `ThemeToggle` component reads from and writes to the `themeStore` (a Svelte 5 rune-based store in `theme.svelte.ts`).
