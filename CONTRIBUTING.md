# Contributing

## Git workflow

### Branch naming

Branches use the ticket number and a short slug, prefixed by type:

| Type | Prefix | Example |
|---|---|---|
| New feature | `feat/` | `feat/5-coordinate-weather` |
| Bug fix | `fix/` | `fix/1-refresh-button` |
| Chore / refactor | `chore/` | `chore/3-update-deps` |

### Per-ticket flow

```bash
# 1. Start from latest main
git checkout main && git pull

# 2. Create a feature branch
git checkout -b feat/5-coordinate-weather

# ... work, commit freely on the branch ...

# 3. Squash merge into main
git checkout main && git pull
git merge --squash feat/5-coordinate-weather
git commit -m "feat(#5): add coordinate-based weather endpoint"
git push

# 4. Clean up the branch
git branch -d feat/5-coordinate-weather
git push origin --delete feat/5-coordinate-weather
```

### Commit messages

Conventional Commits with issue reference:

```
feat(#5): add coordinate-based weather endpoint
fix(#1): prevent refresh button TypeError in widgets
chore(#3): bump TanStack Query to v5.90
```

### Rules

- **One ticket per branch.** Branch off `main`, squash merge back.
- **No pull requests** for solo work — merge directly after verifying.
- **Delete branches immediately** after squash merge. History lives on `main`.
- **Keep `main` green.** Run `pnpm test` and `pnpm lint` before merging.
