# AGENTS.md

## Commands

```bash
pnpm dev              # Start both servers (BFF :3001 + frontend :5173)
pnpm -F server dev    # Start only the BFF
pnpm -F frontend dev  # Start only the Vite frontend
pnpm test             # Run all tests (shared + server)
pnpm -F shared test   # Run shared package tests only
pnpm -F server test   # Run server tests only
pnpm -F frontend check # Svelte type-check
pnpm lint             # Run all lints
pnpm approve-builds   # Required if esbuild postinstall scripts are blocked after install
```

## Git workflow

**One ticket per branch.** Branch off `main`, squash merge back. Delete branch after merge.

| Type | Branch | Commit example |
|---|---|---|
| Feature | `feat/<#>-<slug>` | `feat(#5): add coordinate-based weather` |
| Fix | `fix/<#>-<slug>` | `fix(#1): prevent refresh TypeError` |
| Chore | `chore/<#>-<slug>` | `chore(#3): bump deps` |

```bash
git checkout main && git pull
git checkout -b feat/5-coordinate-weather
# ... work ...
git checkout main && git pull
git merge --squash feat/5-coordinate-weather
git commit -m "feat(#5): add coordinate-based weather endpoint"
git push
git branch -d feat/5-coordinate-weather && git push origin --delete feat/5-coordinate-weather
```

No PRs (solo project). Keep `main` green — run `pnpm test && pnpm lint` before merging. See `CONTRIBUTING.md` for full details.

## Parallel work with worktrees

When multiple tickets are independent (no shared files), implement them in parallel using git worktrees. Each worktree gets its own branch, dependencies, and `/implement` session.

### When to use

- Multiple tickets on the frontier (all blockers resolved)
- Tickets touch different files/packages
- Each ticket fits in a single context window

### Dependency rule

If Ticket B is blocked by Ticket A, **merge A into main first**, then branch B from updated main. Never stack branches.

### Workflow

```bash
# 1. Make sure main is up to date
git checkout main && git pull

# 2. Create worktrees (one per ticket)
git worktree add ../dashboard-<#>-<slug> -b feat/<#>-<slug> main
git worktree add ../dashboard-<#>-<slug> -b feat/<#>-<slug> main

# 3. Install deps in each worktree
cd ../dashboard-<#>-<slug> && pnpm install
cd ../dashboard-<#>-<slug> && pnpm install

# 4. Run /implement on each worktree (parallel agents)
#    Each agent: implement, type-check, test, commit, push

# 5. Open PRs (optional) or squash-merge directly
gh pr create --head feat/<#>-<slug> --base main --title "..." --body-file ...

# 6. After ALL parallel work is done, clean up
git worktree remove ../dashboard-<#>-<slug>
git branch -d feat/<#>-<slug>

# 7. Final check on main after all merges
git checkout main && git pull
pnpm test
```

### Key rules

- Each worktree runs `pnpm test` before commit
- Keep worktrees until the **entire batch** finishes — don't clean up per-ticket
- After all merges, run `pnpm test` on main as a final gate
- Branch naming follows the existing convention: `feat/<#>-<slug>`, `fix/<#>-<slug>`

## Architecture

**pnpm workspaces monorepo** with 4 packages under `packages/`:

| Package | Name | Role |
|---|---|---|
| `shared/` | `@dashboard/shared` | Types (`ApiResult<T>`, API shapes), query key factories, result helpers |
| `eslint-config/` | `@dashboard/eslint-config` | Shared ESLint flat config (`index.mjs` + `svelte.mjs`) |
| `server/` | `server` | Hono BFF on port 3001 — proxies external APIs, normalizes, caches |
| `frontend/` | `frontend` | Svelte 5 + Vite on port 5173 — renders 4 widget dashboard |

Full architecture docs with Mermaid diagrams: `docs/architecture/architecture.md`, `data-flow.md`, `widget-lifecycle.md`.

## Key conventions

### Error handling — `ApiResult<T>` everywhere

Every API call across the stack returns `{ ok: true, data: T } | { ok: false, error: string }`. Defined in `packages/shared/src/result.ts`. Use `isOk()` / `isErr()` guards to narrow types in widgets. Never throw-except at the connector level — convert to `err()`.

### Svelte 5 runes only

This is Svelte 5 with runes. Use `$props()`, `$derived()`, `$state()`, `#snippet`, `{@render}`. Do **not** use Svelte 4 `export let`, `$:`, or `<slot>`. The mount API is `mount(App, { target })` from `svelte`, not `new App()`.

**TanStack Query store pattern:** `createQuery()` returns a Svelte `Readable` store (`{ subscribe }`), not the raw result. Convert it to a Svelte 5 reactive value with `fromStore` from `svelte/store`:

```ts
import { fromStore } from 'svelte/store';
const query = useGamesQuery();
const result = fromStore(query);
// Then access via result.data, result.isLoading, result.refetch()
```

The `$store` prefix also works in `.svelte` files, but `fromStore` is the explicit, documented Svelte 5 pattern.

### Path aliases (frontend only)

Three import aliases configured in both `vite.config.ts` and `tsconfig.json` paths:

```
$lib        → src/lib
$components → src/components
$widgets    → src/widgets
```

Always update both config files when adding an alias.

### Widget component contract

All widgets use `<WidgetCard>` from `$components/WidgetCard.svelte`. Props:

```ts
{ title, isLoading, isFetching, error, onRefresh, children: Snippet, icon?: Snippet, class?: string }
```

The card handles the shell (header, spinner, error state, refresh button). Widgets render only their data content in `{#snippet children()}` and an optional icon in `{#snippet icon()}`. See `docs/architecture/widget-lifecycle.md`.

### Two-layer caching

- **BFF** (`TTLCache<T>`) — in-memory Map with per-source TTL (~2x frontend `staleTime`). Safety net under TanStack Query.
- **Frontend** (TanStack Query) — `staleTime` + `refetchInterval` per source. Background refetch on window focus.

TTL table from the research: Weather 5min/10min, News 15min/30min, Agenda 5min/10min, Games 6h/12h (frontend stale / server cache).

### Mock mode

The server reads `process.env.MOCK`. Default is `true` (no API keys needed). Each connector in `packages/server/src/connectors/` checks `isMockMode()` and returns hardcoded fixtures if true. Live API keys go in `.env` (copy from `.env.example`) with `MOCK=false`. Mock data lives in `packages/server/src/mock-data.ts`.

### Vite proxy

The frontend's `/api/*` requests are proxied to `http://localhost:3001` by Vite's dev server. The BFF also has CORS middleware for `localhost:5173` as a safety measure. No direct cross-origin calls in dev.

### Server — tsx watch + .ts import extensions

The server dev script is `tsx watch src/index.ts` (hot-reload on change). Internal imports use `.ts` extensions (e.g. `'./routes/weather.ts'`) because tsx resolves them. Do not omit extensions or switch to `.js`.

### Tailwind v4

Uses `@tailwindcss/vite` plugin, with `@import "tailwindcss"` in `app.css`. Dark mode via `@custom-variant dark (&:where(.dark, .dark *))`. The dark class toggles on `<html>` via `theme.svelte.ts`. Not Tailwind v3 syntax.

### ESLint — flat config

All packages use ESLint v9 flat config (`eslint.config.mjs`). The shared config lives in `packages/eslint-config/`. The frontend extends `@dashboard/eslint-config/svelte` (which includes the Svelte parser and plugin). Others extend `@dashboard/eslint-config` (TypeScript-only).

### Adding a new data source

1. Add type in `packages/shared/src/api-types.ts`
2. Add query key in `packages/shared/src/query-keys.ts`
3. Add mock data in `packages/server/src/mock-data.ts`
4. Create connector in `packages/server/src/connectors/`
5. Create route in `packages/server/src/routes/`
6. Register route in `packages/server/src/index.ts`
7. Add fetch functions in `packages/frontend/src/lib/api-client.ts`
8. Create `packages/frontend/src/widgets/<name>/` with `*-api.ts` (query hook) and `<Name>Widget.svelte`
9. Add widget to the grid in `packages/frontend/src/App.svelte`

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `gabrielLoff/dashboard`. See `docs/agents/issue-tracker.md`.

### Triage labels

Labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`, plus `area:frontend`, `area:backend`, `area:shared`, `area:config`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
