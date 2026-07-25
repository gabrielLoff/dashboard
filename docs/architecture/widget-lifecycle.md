# Widget Lifecycle & Component Contract

## Widget states

Every widget passes through four states. The `<WidgetCard>` wrapper handles the shell; the widget content handles the data display.

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
│  [icon]  Title              [refresh]│  ← header: always visible
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
│  [data]       children rendered      │  ← children slot
│              [bg-spinner]            │  ← isFetching indicator
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
  onRefresh: () => void;      // Called on header refresh button click
  children: Snippet;          // The widget's data content
  class?: string;             // Extra classes for the outer card
}
```

### Usage pattern

```svelte
<script lang="ts">
  const query = useWeatherQuery();
  const data = $derived(query.data);
  const error = $derived(data && !isOk(data) ? data.error : '');
</script>

<WidgetCard
  title="Weather"
  isLoading={query.isLoading}
  isFetching={query.isFetching}
  error={error}
  onRefresh={() => query.refetch()}
>
  {#snippet icon()}
    <CloudSun class="h-4 w-4" />
  {/snippet}
  {#snippet children()}
    {#if data && isOk(data)}
      <!-- render data.data -->
    {/if}
  {/snippet}
</WidgetCard>
```

## Adding a new widget

1. Define the type in `packages/shared/src/api-types.ts`
2. Add a query key in `packages/shared/src/query-keys.ts`
3. Create a connector in `packages/server/src/connectors/`
4. Add mock data in `packages/server/src/mock-data.ts`
5. Create a route in `packages/server/src/routes/`
6. Mount the route in `packages/server/src/index.ts`
7. Add API functions in `packages/frontend/src/lib/api-client.ts`
8. Create `packages/frontend/src/widgets/<name>/` with:
   - `<name>-api.ts` — `use<Name>Query()` hook
   - `<Name>Widget.svelte` — the widget component
9. Add the widget to `App.svelte` in the grid

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
    UseStored --> Apply["toggle .dark on &lt;html&gt;"]
    UsePref --> Apply

    Toggle["ThemeToggle click"] --> Flip["flip light ↔ dark"]
    Flip --> Save["write to localStorage"]
    Save --> Apply
```

The theme is applied via a CSS class on `<html>`. Tailwind v4's `@custom-variant dark` declaration enables `dark:` prefix variants. The `ThemeToggle` component reads from and writes to the `themeStore` (a Svelte 5 rune-based store in `theme.svelte.ts`).
