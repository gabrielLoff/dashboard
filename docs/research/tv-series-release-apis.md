# Free APIs for TV Series Release Tracking

## Summary

Several free APIs can track TV series release dates, with **TVmaze** being the best option for general-purpose tracking (no API key, free tier with 20 calls/10 seconds). **Simkl** offers a calendar API with upcoming episodes and premieres, requiring only a client_id. **Epguides API** provides a simple, no-auth endpoint for getting next/upcoming episodes for specific shows.

## Findings

### TVmaze API

**What it offers:** Free REST API with endpoints for TV schedules, episode lists, show metadata, and upcoming episodes. Includes `/schedule` endpoint for daily schedules by country, `/shows/:id/episodes` for episode lists, and embedding to get next episode.

**Rate limits:** At least 20 calls every 10 seconds per IP. CORS enabled.

**Auth:** No API key required for public endpoints. Premium user API available for follows/scrobbling.

**How to track upcoming episodes:** Use `/shows/:id?embed=nextepisode` to get show details with next upcoming episode embedded, or `/schedule` to get all episodes airing on a specific date.

**Source:** [TVmaze API Documentation](https://www.tvmaze.com/api) — "We provide a free, fast and clean REST API that's easy to use, returns JSON and conforms to the HATEOAS and HAL principles."

### Simkl API

**What it offers:** TV show metadata, episode lists, airing schedule, and premieres. Includes `/tv/airing` for what's airing now and `/tv/premieres/{param}` for upcoming season/series premieres. Also provides static JSON calendar files on CDN.

**Rate limits:** Requires client_id and User-Agent header. Rate limits not explicitly stated but CDN-hosted calendar files are updated every 6 hours.

**Auth:** Only client_id required (no OAuth token for public endpoints). Calendar data is public.

**How to track upcoming episodes:** Use `https://data.simkl.in/calendar/tv.json` for upcoming episodes calendar, or `/tv/premieres/{param}` for premieres.

**Source:** [Simkl API Reference](https://api.simkl.org/api-reference/tv) — "The TV API returns metadata about TV shows in Simkl's catalog. None of these endpoints require an OAuth token — a client_id is enough."

### Epguides API

**What it offers:** Free REST API for TV show data, episode lists, air dates, and summaries. Includes endpoint for next/upcoming episode for any show. Sources data from epguides.com, TVMaze, and IMDB.

**Rate limits:** Not explicitly documented, but appears to be open.

**Auth:** No API key required.

**How to track upcoming episodes:** Use `/shows/{title}/episodes/next` to get the next upcoming episode for a specific show.

**Source:** [Epguides API Documentation](https://epguides-api.readthedocs.io/en/latest/) — "Free REST API for TV show data, episode lists, and air dates. No API key required."

### Watchmode API

**What it offers:** TV show metadata including seasons, episodes, release dates, and streaming availability. Free Developer plan with 2,500 monthly API requests for non-commercial use.

**Rate limits:** 2,500 requests per month on free tier.

**Auth:** API key required (free to obtain, no credit card).

**How to track upcoming episodes:** Use show details endpoint to get season/episode information with release dates.

**Source:** [Watchmode API](https://api.watchmode.com/) — "The Developer plan includes 2,500 free monthly API requests for non-commercial use. You can request a free Watchmode API key without a credit card."

## Sources

- [TVmaze API Documentation](https://www.tvmaze.com/api)
- [Simkl API Reference](https://api.simkl.org/api-reference/tv)
- [Epguides API Documentation](https://epguides-api.readthedocs.io/en/latest/)
- [Watchmode API](https://api.watchmode.com/)
