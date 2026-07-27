# Dashboard

A local dashboard aggregating weather, news, agenda, and free games data in one place. Built with Svelte 5, Hono, and TanStack Query.

## Prerequisites

- **Node.js** v22+
- **pnpm** (install via `npm install -g pnpm`)

## Quick start

```bash
# Install dependencies
pnpm install

# Approve esbuild postinstall scripts (first install only)
pnpm approve-builds

# Start both servers — BFF on :3001, frontend on :5173
pnpm dev
```

Open `http://localhost:5173`. Four widgets render immediately with mock data — no API keys needed.

## Mock vs live data

By default, `MOCK=true` in the environment and all connectors return hardcoded fixtures. To connect real APIs:

```bash
cp packages/server/.env.example packages/server/.env
# Fill in your API keys in .env
# Set MOCK=false

pnpm dev
```

## Project structure

```
packages/
├── shared/          # Types, ApiResult<T>, query key factories
├── eslint-config/   # Shared ESLint flat config (base + Svelte)
├── server/          # Hono BFF (:3001) — proxies external APIs, caches, normalizes
└── frontend/        # Svelte 5 + Vite (:5173) — 4 widget grid
```

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start both servers concurrently |
| `pnpm -F server dev` | Start only the BFF |
| `pnpm -F frontend dev` | Start only the Vite frontend |
| `Ctrl+C` | Stop running servers |
| `pnpm test` | Run all tests |
| `pnpm -F shared test` | Run shared package tests |
| `pnpm -F server test` | Run server tests |
| `pnpm -F frontend check` | Svelte type-check |
| `pnpm lint` | Run all lints |

## Architecture

Full docs with Mermaid diagrams live in `docs/architecture/`:

- [architecture.md](docs/architecture/architecture.md) — system overview, caching, package boundaries
- [data-flow.md](docs/architecture/data-flow.md) — request lifecycle, error propagation, refresh strategy
- [widget-lifecycle.md](docs/architecture/widget-lifecycle.md) — widget states, WidgetCard contract, adding new sources

## Agent skills

Agent configuration lives in `docs/agents/`. See `AGENTS.md` for the full agent reference.
