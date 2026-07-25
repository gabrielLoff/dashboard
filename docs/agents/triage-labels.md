# Triage Labels

The skills speak in terms of five canonical triage roles plus area scoping. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Role | Label | Meaning |
|---|---|---|
| `needs-triage` | `needs-triage` | Maintainer needs to evaluate this issue |
| `needs-info` | `needs-info` | Waiting on reporter for more information |
| `ready-for-agent` | `ready-for-agent` | Fully specified, ready for an AFK agent |
| `ready-for-human` | `ready-for-human` | Requires human implementation |
| `wontfix` | `wontfix` | Will not be actioned |

## Area labels

| Area | Label | Scope |
|---|---|---|
| Frontend | `area:frontend` | Svelte 5 + Vite app, widgets, components, styling |
| Backend | `area:backend` | Hono BFF, connectors, routes, caching |
| Shared | `area:shared` | `@dashboard/shared` types, result helpers, query keys |
| Config | `area:config` | Toolchain, workspace, ESLint, TS, CI, docs |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.
