# GamerPower API Integration

## Summary

The GamerPower API is a **free, no-authentication REST API** at `https://www.gamerpower.com/api`. It requires **no API key** — simply send HTTP GET requests. The only requirement is attribution with a hyperlink back to GamerPower.com. Rate limit is 10 requests/second. The main endpoint for this project is `/giveaways?platform=pc`, which returns a JSON array of active giveaway objects.

## Findings

### Endpoints

| Endpoint | Description |
|---|---|
| `GET /giveaways` | All active giveaways |
| `GET /giveaway?id={id}` | Single giveaway by ID |
| `GET /giveaways?platform={platform_name}` | Filter by platform |
| `GET /giveaways?type={type_name}` | Filter by type |
| `GET /giveaways?sort-by={sort_name}` | Sort by `date`, `value`, or `popularity` |
| `GET /filter?platform=a+b&type=x+y` | Multi-value filter with `+` separators |
| `GET /worth` | Total live giveaways & worth estimation in USD |
| `GET /worth?platform={platform_name}&type={type_name}` | Worth for filtered giveaways |

Query params can be combined, e.g.: `?platform=steam&type=loot&sort-by=popularity`.

### Authentication

**None.** No API key, no token, no OAuth. The `FREEGAMES_API_KEY` env var in the current connector is unnecessary — the API is fully open.

### Response format

Each giveaway object has these fields (from live API response):

```json
{
  "id": 3301,
  "title": "Bad cat Sam (IndieGala) Giveaway",
  "worth": "$2.99",
  "thumbnail": "https://www.gamerpower.com/offers/1/68d828fc4174f.jpg",
  "image": "https://www.gamerpower.com/offers/1b/68d828fc4174f.jpg",
  "description": "Download Bad cat Sam for free on IndieGala...",
  "instructions": "1. Click the button to visit the giveaway page.\r\n2. Login...",
  "open_giveaway_url": "https://www.gamerpower.com/open/bad-cat-sam-pc-giveaway",
  "published_date": "2026-07-23 15:46:39",
  "type": "Game",
  "platforms": "PC, DRM-Free",
  "end_date": "N/A",
  "users": 23490,
  "status": "Active",
  "gamerpower_url": "https://www.gamerpower.com/bad-cat-sam-pc-giveaway",
  "open_giveaway": "https://www.gamerpower.com/open/bad-cat-sam-pc-giveaway"
}
```

Key observations:
- `thumbnail` — small image; `image` — full-size image.
- `platforms` is a **comma-separated string** (e.g. `"PC, Steam, DRM-Free"`), not an array.
- `end_date` can be `"N/A"` for giveaways without a known end date, or a datetime string like `"2026-07-30 23:59:00"`.
- `open_giveaway_url` is a GamerPower redirect URL, not the direct store URL.
- `status` is `"Active"` for all results (the `/giveaways` endpoint only returns active giveaways).

### Rate limits / constraints

- **10 requests per second** maximum. Exceeding this may result in throttling.
- **Attribution required**: must include an active hyperlink back to GamerPower.com.
- Cannot claim the data as your own or sell it without permission.
- CORS support available; RapidAPI proxy is offered as an alternative for CORS-restricted clients (not relevant for a BFF).

### Platform filtering

Use the `platform` query parameter with the platform slug:

| Platform | Slug |
|---|---|
| PC | `pc` |
| Steam | `steam` |
| Epic Games Store | `epic-games-store` |
| GOG | `gog` |
| PS4 / PS5 | `ps4` / `ps5` |
| Xbox Series X/S / Xbox One | `xbox-series-xs` / `xbox-one` |
| Switch | `switch` |
| Android / iOS | `android` / `ios` |
| DRM-Free | `drm-free` |
| itch.io | `itchio` |

No pagination parameters are documented. The API returns all active giveaways in a single response array.

## Connector assessment

Current connector at `packages/server/src/connectors/games.ts`:

### What's correct
- Base URL `https://www.gamerpower.com/api` — correct.
- Endpoint path `/giveaways?platform=pc` — correct.
- Field mapping: `id`, `title`, `platforms`→`platform`, `type`→`source`, `open_giveaway_url`→`url`, `image`→`imageUrl` — all correct.

### What needs to change

1. **Remove `FREEGAMES_API_KEY` — no auth needed.** The API is fully open. The current code falls back to mock mode when `!API_KEY` is true, which means it will **never call the live API** even if `MOCK=false`, because `FREEGAMES_API_KEY` is empty by default. Remove lines that reference `API_KEY` and remove `FREEGAMES_API_KEY` from `.env.example`. The connector should gate on `isMockMode()` only.

2. **Handle `end_date: "N/A"`.** The current code does `g.end_date.split(' ')[0]` which returns `"N/A"` for giveaways without an end date. This should be guarded — if `end_date` is `"N/A"`, map `expiryDate` to an empty string (or omit it). Otherwise, `"N/A"` leaks through as a display value.

3. **(Optional) Map additional useful fields.** Consider mapping `worth` (monetary value) and `description` if the frontend widget would benefit from them. The `FreeGame` interface in shared types has no `worth` field currently, so this would require adding it there too.

### Suggested fix

```ts
// Remove:
const API_KEY = process.env.FREEGAMES_API_KEY;

// Change the gate from:
if (isMockMode() || !API_KEY) {
// To:
if (isMockMode()) {

// Fix end_date:
const rawEnd = g.end_date;
expiryDate: rawEnd === 'N/A' ? '' : (rawEnd.split(' ')[0] ?? ''),
```

## Sources

- [GamerPower API Documentation](https://www.gamerpower.com/api-read)
- [Live API response: /giveaways?platform=pc](https://www.gamerpower.com/api/giveaways?platform=pc)
- [GitHub: api-evangelist/gamerpower (OpenAPI spec)](https://github.com/api-evangelist/gamerpower)
- [RapidAPI: GamerPower](https://rapidapi.com/digiwalls/api/gamerpower)
