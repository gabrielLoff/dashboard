# Entertainment Page — Feature Ideas

Backlog of suggestions for enhancing the entertainment section of the dashboard. Move items to issues when ready to implement.

## Quick wins — ShowsWidget enhancements

### 1. Episode watch progress
Mark individual episodes as watched. Show progress bars per season. TVmaze provides full episode lists via `/shows/{id}/episodes`. Need a `WatchProgress` store alongside existing `WatchlistEntry`. Watchlist store already has `id`, `name`, `image` — add `watchedEpisodes: Set<string>` keyed by `S01E03`.
- **Scope**: small — new store + progress UI in ShowsWidget
- **Category**: UX
- **Status**: grilling

### 2. Show ratings & genres
TVmaze returns `rating.average` and `genres[]` on every show. Surface these in search results and watchlist. No new API needed, just pass fields through the connector.
- **Scope**: small — connector already has the data, just not normalized
- **Category**: UX
- **Status**: backlog

### 3. Streaming platform info
TVmaze returns `webChannel` and `network` per show. Already rendered in search results but not in watchlist view. Add to each tracked show so user knows *where* to watch.
- **Scope**: small — template change only
- **Category**: UX
- **Status**: backlog

## New widgets

### 4. Movie watchlist
TMDB (The Movie Database) free API — movie search, watchlist, streaming availability. Mirror the Shows pattern: search, add to watchlist, see upcoming releases. TMDB returns `release_dates` per region for "in theaters" vs "streaming on Netflix."
- **Scope**: medium — new connector, route, widget, manifest
- **Category**: Data
- **Status**: backlog

## Cross-cutting features

### 7. Unified entertainment calendar
Combine upcoming show episodes, movie release dates, and game giveaways into a single timeline/calendar view. Extend `UpcomingEntry` to include source type (`show | movie | game`). New widget that aggregates from existing data.
- **Scope**: medium — new widget reading from existing stores/queries
- **Category**: UX
- **Status**: backlog

### 8. "What to watch next" suggestion
Based on watchlist genres and ratings, suggest similar shows. TVmaze has show metadata — simple genre-based filtering client-side, or proxy a recommendation API. Shows curated list when caught up on everything.
- **Scope**: large — needs recommendation strategy, new widget
- **Category**: Data, UX
- **Status**: backlog
