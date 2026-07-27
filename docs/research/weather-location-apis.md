# Weather Location Resolution — Free API Options for a Personal Dashboard

## Summary

The current stack (Browser Geolocation → Nominatim reverse geocode → Open-Meteo forward geocode → Open-Meteo weather) is functional but fragile. **The biggest risk is Nominatim's 1 req/sec rate limit and IP-blocking policy**, which can knock out the entire location-to-weather pipeline. The recommended path: use browser geolocation to get coordinates directly, bypass forward/reverse geocoding for the weather API call, and reverse geocode only once for display purposes. Replace Nominatim with BigDataCloud's free client-side reverse geocoding (keyless, GPS+IP fallback, same JSON schema whether user grants or denies location). Keep Open-Meteo for weather and forward geocoding (it's the best free option). Add an IP geolocation fallback so the weather widget works even when the user denies browser location permission.

---

## 1. Reverse Geocoding: Is Nominatim the best free option?

### Nominatim (public instance at nominatim.openstreetmap.org)

**The gold standard for free, but with hair-trigger rate limiting.**

| Factor | Detail |
|---|---|
| Cost | Free. No API key, no sign-up. |
| Rate limit | **1 request per second** (absolute maximum). Soft cap of ~2,500/day recommended. |
| Bulk use | Not allowed. Periodic requests from apps are "strongly discouraged." |
| User-Agent | Must provide a valid, identifying `User-Agent` header. Stock library defaults (e.g. `curl/8.x`) trigger IP bans. |
| Reliability | Documented intermittent timeouts and 500 errors (GitHub issues #3405, #3377). Runs on donated servers with no SLA. |
| Licensing | ODbL — share-alike required for larger extracts. Small extractions likely fair use. |
| Data quality | Excellent in Europe and well-mapped regions. Weak in areas with limited OSM coverage. |

**Verdict:** Nominatim works for a personal dashboard if you (a) cache aggressively, (b) set a proper User-Agent, and (c) stay well under 1 req/sec. However, the 1 req/sec limit means a single reverse geocode on page load is fine, but any polling or refresh loop that calls Nominatim risks an IP ban. The server has no uptime guarantee and can degrade silently.

**Sources:**
- [Nominatim Usage Policy — OSM Foundation](https://operations.osmfoundation.org/policies/nominatim/)
- [Nominatim rate limits — OSM Help](https://help.openstreetmap.org/questions/86982/nominatim-rate-limits/)
- [Nominatim timeouts — GitHub Issue #3405](https://github.com/osm-search/Nominatim/issues/3405)
- [APIScout — Best Geocoding APIs 2026](https://apiscout.dev/guides/best-geocoding-apis-2026)

### Free alternatives to Nominatim for reverse geocoding

| Provider | Free Tier | API Key | Client/Server | Notable |
|---|---|---|---|---|
| **BigDataCloud** | Unlimited (fair use) | **None** | Client-side only | GPS + IP fallback. Same JSON schema with or without coordinates. City-level accuracy. |
| **LocationIQ** | 5,000 req/day | Required | Server-side | Built on OSM data. No 1 req/s throttle. |
| **Geoapify** | 3,000 req/day | Required | Server-side | 5 req/sec on free tier. |
| **LatLng** | 300 req/day | Required | Server-side | Same OSM data. No 1 req/s throttle. |
| **OpenCage** | 2,500 req/day | Required | Server-side | Explicitly allows caching. |

**Best pick for this project: BigDataCloud.** It is:
- Free, no API key, no sign-up.
- Client-side (matches the browser API flow).
- **Falls back to IP geolocation automatically** when user denies location permission.
- Returns the same JSON schema in both cases (`{ city, locality, countryName, principalSubdivision, ... }`).
- The free tier is designed for exactly this use case — user-initiated reverse geocoding from browser coordinates.
- Server-side fallback available (50K free/month with API key) for dev/testing.

**Notable limitation:** Client-side only. Server-side calls to the client endpoint trigger HTTP 402 and IP bans. For the BFF pattern, this means the reverse geocoding call must happen in the browser (call BigDataCloud directly from the frontend widget), not through the Hono BFF.

**Sources:**
- [BigDataCloud Free Client-Side Reverse Geocoding Docs](https://www.bigdatacloud.com/free-api/free-reverse-geocode-to-city-api)
- [BigDataCloud Fair Use Policy](https://www.bigdatacloud.com/docs/article/fair-use-policy-for-free-client-side-reverse-geocoding-api)
- [BigDataCloud: Convert getCurrentPosition to City Name](https://www.bigdatacloud.com/blog/convert-getcurrentposition-free-reversegeocoding-api)
- [LocationIQ Free Reverse Geocoding](https://locationiq.com/)

---

## 2. Forward Geocoding: Is Open-Meteo the best free option?

**Yes.** Open-Meteo's Geocoding API is the strongest free forward geocoding option available.

| Factor | Detail |
|---|---|
| Cost | Free for non-commercial use. No API key, no sign-up. |
| Rate limit | 600 calls/min, 5,000/hour, 10,000/day (free tier). |
| Coverage | Global. Supports fuzzy matching (3+ chars), postal codes, country filtering. |
| Data source | GeoNames database (same underlying data as many commercial providers). |
| Response | Returns lat, lon, name, country, admin areas, population, timezone, elevation. |
| Protocol | REST via HTTP GET. Also supports protobuf for efficiency. |
| Language | Localized results via `&language=` parameter. |

**Alternatives considered:**
- **Nominatim (forward):** Same 1 req/sec limit. Not a practical upgrade.
- **Photon API:** Free OSM-based forward geocoder. Complement, not replacement.
- **OpenWeatherMap Geocoding:** Built into the weather platform (single API key). Requires sign-up. 1M calls/month free. Only worth considering if already using OWM for weather.

**Verdict:** Stay with Open-Meteo Geocoding. It's keyless, generous, and part of the same ecosystem as the weather API. There is no compelling reason to switch.

**Sources:**
- [Open-Meteo Geocoding API Docs](https://open-meteo.com/en/docs/geocoding-api)
- [Open-Meteo Pricing](https://open-meteo.com/en/pricing)
- [Open-Meteo Geocoding GitHub](https://github.com/open-meteo/geocoding-api)

---

## 3. Can we skip reverse geocoding entirely?

**Yes, partially.** The main question is: _what is reverse geocoding doing in the pipeline?_

### Current flow (fragile, double-geocodes)

```
User types "Porto Alegre"
  → Open-Meteo forward geocode → lat/lon
  → Open-Meteo weather API (uses lat/lon)
  → Nominatim reverse geocode (lat/lon → "Porto Alegre" for display)
```

This is **redundant** — the user already typed the city name, but we reverse geocode to get it back. For a typed-city flow, forward geocoding is enough; display the matched city name from the geocoding response.

### Browser geolocation flow (the problematic one)

```
User clicks "Use my location"
  → Browser geolocation → lat/lon
  → Open-Meteo weather API (uses lat/lon)
  → Nominatim reverse geocode → city name for display
```

Here, reverse geocoding is needed for display. But it's a single call per session, not per poll.

### Options to skip or reduce reverse geocoding

| Approach | Pros | Cons |
|---|---|---|
| **Display coordinates only** | Zero API calls. No rate limits. | Terrible UX. "Your weather: -30.03, -51.23" |
| **IP geolocation fallback** | No permission needed. Works on first load. City-level. | Accuracy ~65-85% at city level. VPN users get wrong city. |
| **BigDataCloud GPS+IP fallback** | Single endpoint. Returns city whether or not user grants GPS. | Client-side only (can't call from BFF). Fair use policy. |
| **Keep Nominatim but cache heavily** | Familiar. OSM data. | 1 req/sec risk. IP bans for User-Agent issues. |
| **Forward geocode from browser coords** | Same ecosystem (Open-Meteo). Keyless. | Round-trip: coords → Open-Meteo geocoding search by name → nearest match. Not a real reverse geocode. |

### Recommendation

**Replace Nominatim with BigDataCloud.** It solves the permission-denied case natively:
- If user grants location → GPS coordinates → city name via BigDataCloud
- If user denies → IP geolocation → city name via BigDataCloud (same endpoint, same schema)
- No rate limits, no API key, no server-side call needed

For the typed-city flow, display the city name from Open-Meteo's forward geocoding response — no reverse geocoding needed at all.

**Sources:**
- [IP Geolocation vs GPS Accuracy — BrowserInsight 2026](https://browserinsight.net/blog/ip-geolocation-accuracy)
- [IP Geolocation Accuracy Study — ipapi.is](https://ipapi.is/blog/ip-geolocation-accuracy.html)
- [City-level IP accuracy: 65-85% — Am I Cited discussion](https://www.amicited.com/discussion/how-do-developers-support-geo-discussion/)

---

## 4. Browser Geolocation API: alternatives, polyfills, best practices

### No polyfill needed

The Geolocation API (`navigator.geolocation`) has been available in all browsers since July 2015. It works on Chrome, Firefox, Safari, Edge, and mobile browsers. No polyfill is necessary.

**One exception:** In China, Google's Wi-Fi positioning service is blocked, so the vanilla API may return poor results. Local alternatives (Baidu, Autonavi) fill the gap, but this is irrelevant for a personal dashboard used outside China.

### Key best practices

| Practice | Detail |
|---|---|
| **Ask on user gesture, not page load** | Users presented with a permission dialog on page load deny ~70% of the time. Ask after they click "Use my location." |
| **Always provide a manual fallback** | Text input for city name or ZIP code. If geolocation fails or is denied, the widget still works. |
| **Use `maximumAge` to cache** | Set `maximumAge: 60000` (1 min) to reuse recent positions. Avoids reactivating GPS on every poll. |
| **Prefer coarse over fine** | Don't set `enableHighAccuracy: true` unless you need street-level. Weather needs city-level at most. |
| **Set a reasonable timeout** | Default is `Infinity`. Set `timeout: 10000` (10s) so the UI doesn't hang. |
| **HTTPS required** | Chrome 50+ blocks geolocation on HTTP. Localhost is exempt. |
| **Feature-detect first** | `if (!navigator.geolocation) { /* fallback */ }` |
| **Handle all error codes** | `PERMISSION_DENIED` (1), `POSITION_UNAVAILABLE` (2), `TIMEOUT` (3). Each needs a distinct fallback path. |
| **Don't use `watchPosition`** | Continuous tracking burns battery and adds no value for a dashboard. Use `getCurrentPosition` once. |

### Progressive location strategy (recommended for this dashboard)

```
Page load
  → No location prompt (avoid permission fatigue)
  → Show weather widget with "Set location" prompt or last-known city

User clicks "Use my location"
  → navigator.geolocation.getCurrentPosition({ maximumAge: 300000, timeout: 10000 })
  → On success: lat/lon → BigDataCloud reverse geocode (get city name for display)
  → On failure/denial: BigDataCloud without coordinates (returns IP-based city)
  → Store city preference in localStorage for next visit

User types a city name
  → Open-Meteo forward geocode → lat/lon
  → Open-Meteo weather API
  → Display city name from geocoding response
```

**Sources:**
- [web.dev — User Location Best Practices](https://web.dev/articles/user-location)
- [MDN — Using the Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API/Using_the_Geolocation_API)
- [mapping.live — Geolocation API Support, UX, and Fallbacks](https://mapping.live/geolocation-api-browser-support-permission-ux-and-fallback-strategies)
- [MDN — Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)

---

## 5. Pitfalls with the current stack (Nominatim + Open-Meteo + Browser Geolocation)

| # | Pitfall | Severity | Fix |
|---|---|---|---|
| 1 | **Nominatim 1 req/sec limit** | High | Replace with BigDataCloud (client-side, no rate limit). |
| 2 | **Nominatim IP bans for missing User-Agent** | High | If keeping Nominatim, set `User-Agent: Dashboard/1.0 (personal-use)` in the BFF connector. |
| 3 | **No fallback when user denies geolocation** | High | Add IP geolocation fallback. BigDataCloud handles this natively. |
| 4 | **Double geocoding waste (forward + reverse for typed city)** | Medium | Display city name from forward geocoding response. Only reverse-geocode when using GPS coordinates. |
| 5 | **Nominatim instability (intermittent 500s)** | Medium | The public server has no SLA. Timeouts documented in GitHub issues. Replace or add fallback. |
| 6 | **Browser geolocation prompt on page load** | Medium | Defer location prompt to a user gesture. Show last-known city or search box on first render. |
| 7 | **Nominatim call from server (BFF)** | Medium | Only the browser can call `getCurrentPosition()`. If reverse geocoding stays in BFF, coordinates must be sent from frontend. BigDataCloud client-side avoids this entirely. |
| 8 | **No `maximumAge` caching on `getCurrentPosition`** | Low | Add `maximumAge: 300000` (5 min) to avoid reactivating GPS hardware on every refresh. |
| 9 | **No `timeout` on `getCurrentPosition`** | Low | Add `timeout: 10000` to avoid infinite hang. |
| 10 | **IP-based fallback accuracy is only city-level (~65-85%)** | Low | Acceptable for a weather dashboard. City-level is sufficient. |

---

## 6. Unified providers: geocoding + weather in one

| Provider | Forward Geocoding | Reverse Geocoding | Weather | API Key | Free Tier |
|---|---|---|---|---|---|
| **Open-Meteo** | Yes (keyless) | No | Yes (keyless) | None | 10K/day |
| **OpenWeatherMap** | Yes | Yes | Yes | Required | 1M calls/month |
| **WeatherAPI.com** | Yes (city name, lat/lon, IP, ZIP) | Yes (lat/lon → city) | Yes | Required | 100K calls/month |
| **Tomorrow.io** | No (coordinates only) | No | Yes | Required | 500 calls/day |
| **Visual Crossing** | Yes | No | Yes | Required | 1,000 records/day |

### Analysis

- **Open-Meteo is the best free weather provider** (as established in `free-weather-apis.md`), but it lacks reverse geocoding. Forward geocoding is available and already used.
- **OpenWeatherMap does all three** (forward + reverse geocoding + weather) with a single API key. 1M calls/month free, no credit card. This eliminates the Nominatim dependency entirely. The cost is: an API key sign-up (email only).
- **WeatherAPI.com** also does all three. 100K calls/month free. Supports IP-based geolocation directly (no browser API needed). The cost is: API key sign-up.

### Recommendation

**Stick with Open-Meteo for weather and forward geocoding.** It's keyless and already implemented. For reverse geocoding, use BigDataCloud client-side (also keyless). This keeps the entire stack at zero sign-up.

**If the BigDataCloud client-side approach proves problematic** (BFF architecture doesn't allow frontend-to-third-party calls, or fair use policy concerns), switch to OpenWeatherMap as a unified fallback — one API key, no Nominatim, no separate geocoding service. The sign-up friction is a one-time cost.

**Sources:**
- [OpenWeatherMap Geocoding API](https://openweathermap.org/api/geocoding-api)
- [WeatherAPI.com Docs](https://www.weatherapi.com/docs/)
- [Open-Meteo Pricing](https://open-meteo.com/en/pricing)

---

## 7. Architectural recommendation

### Recommended flow (replaces current three-provider chain)

```
┌──────────────────────────────────────────────────────────┐
│                      FRONTEND (Browser)                    │
│                                                            │
│  ┌─"Use my location" click──────────────────────────────┐ │
│  │  navigator.geolocation.getCurrentPosition({           │ │
│  │    maximumAge: 300000, timeout: 10000                 │ │
│  │  })                                                   │ │
│  │    → success: { lat, lon }                            │ │
│  │    → failure/denied: null (skip to IP fallback)       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─Reverse geocode (client-side)────────────────────────┐ │
│  │  fetch(`https://api.bigdatacloud.net/data/            │ │
│  │    reverse-geocode-client?latitude=${lat}             │ │
│  │    &longitude=${lon}`)                                │ │
│  │  → { city, countryName, ... }                         │ │
│  │  // If lat/lon null, call without params              │ │
│  │  // → returns IP-based city estimate                  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─Typed city (manual fallback)─────────────────────────┐ │
│  │  User types "Porto Alegre" in search box              │ │
│  │    → BFF: GET /api/weather?city=Porto+Alegre          │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Store city preference in localStorage                     │
│  for next visit (avoid repeat prompt)                      │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────┴───────────────────────────────────┐
│                   BFF SERVER (Hono :3001)                  │
│                                                            │
│  GET /api/weather?city=Porto+Alegre                        │
│    → Open-Meteo forward geocode → { lat, lon }             │
│    → Open-Meteo weather forecast → { current, ... }        │
│    → Return { city, weather, ... }                         │
│                                                            │
│  GET /api/weather?lat=-30.03&lon=-51.23                    │
│    → Open-Meteo weather forecast → { current, ... }        │
│    → Return { weather, ... }                               │
│                                                            │
│  In-memory cache (TTLCache): 10 min for both endpoints     │
└───────────────────────────────────────────────────────────┘
```

### Key changes from current architecture

1. **Remove Nominatim dependency entirely.**
2. **Add BigDataCloud client-side reverse geocoding** (called directly from the weather widget in the browser, not through BFF).
3. **Add IP geolocation fallback** (happens automatically via BigDataCloud when coordinates are missing).
4. **Two BFF endpoints** instead of one: `?city=` for typed input, `?lat=&lon=` for GPS coordinates. This avoids sending coordinates through the reverse-geocode-then-forward-geocode round-trip.
5. **Cache the result** in `localStorage` so the weather widget shows data immediately on next visit without any prompt.
6. **Defer the geolocation prompt** to a user action (click "Use my location" button inside the widget), not on page load.

### Provider summary

| Function | Current | Recommended | Why |
|---|---|---|---|
| Weather data | Open-Meteo | Open-Meteo (keep) | Best free, keyless. |
| Forward geocoding | Open-Meteo Geocoding | Open-Meteo Geocoding (keep) | Same ecosystem, keyless. |
| Reverse geocoding | Nominatim (OSM) | BigDataCloud (client-side) | No key, no rate limit, GPS+IP fallback. |
| Browser position | Geolocation API | Geolocation API (keep) | Universal support, no alternative. |
| Fallback location | None | BigDataCloud IP fallback / manual city input | Essential for denied-permission case. |

---

## Sources

- [Nominatim Usage Policy — OSM Foundation](https://operations.osmfoundation.org/policies/nominatim/)
- [Nominatim rate limits — OSM Help](https://help.openstreetmap.org/questions/86982/nominatim-rate-limits/)
- [Nominatim timeouts — GitHub Issue #3405](https://github.com/osm-search/Nominatim/issues/3405)
- [APIScout — Best Geocoding APIs 2026](https://apiscout.dev/guides/best-geocoding-apis-2026)
- [API Deposu — Google Geocoding Alternatives 2026](https://apideposu.com/en/blog/google-geocoding-alternatives)
- [Continuuiti — Best Geocoding APIs Compared 2026](https://continuuiti.com/blog/best-geocoding-api/)
- [DevVersus — Google Maps vs OpenStreetMap 2026](https://devversus.com/compare/google-maps-vs-openstreetmap-api)
- [BigDataCloud Free Client-Side Reverse Geocoding Docs](https://www.bigdatacloud.com/free-api/free-reverse-geocode-to-city-api)
- [BigDataCloud Fair Use Policy](https://www.bigdatacloud.com/docs/article/fair-use-policy-for-free-client-side-reverse-geocoding-api)
- [BigDataCloud: Convert getCurrentPosition to City Name](https://www.bigdatacloud.com/blog/convert-getcurrentposition-free-reversegeocoding-api)
- [Open-Meteo Geocoding API Docs](https://open-meteo.com/en/docs/geocoding-api)
- [Open-Meteo Pricing](https://open-meteo.com/en/pricing)
- [Open-Meteo Geocoding GitHub](https://github.com/open-meteo/geocoding-api)
- [OpenWeatherMap Geocoding API](https://openweathermap.org/api/geocoding-api)
- [web.dev — User Location Best Practices](https://web.dev/articles/user-location)
- [MDN — Using the Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API/Using_the_Geolocation_API)
- [MDN — Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [MDN — getCurrentPosition()](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition)
- [mapping.live — Geolocation API Support, UX, and Fallbacks](https://mapping.live/geolocation-api-browser-support-permission-ux-and-fallback-strategies)
- [Millo — IP Geolocation vs Browser Geolocation](https://millo.co/ip-geolocation-vs-browser-geolocation-which-one-should-developers-use)
- [BrowserInsight — IP Geolocation Accuracy 2026](https://browserinsight.net/blog/ip-geolocation-accuracy)
- [ipapi.is — IP Geolocation Accuracy Study](https://ipapi.is/blog/ip-geolocation-accuracy.html)
- [ipgeolocation.io — What Is IP Geolocation (2026)](https://ipgeolocation.io/guides/what-is-ip-geolocation-how-it-works)
- [Am I Cited — IP vs Geolocation API Discussion](https://www.amicited.com/discussion/how-do-developers-support-geo-discussion/)
- [WeatherAPI.com Docs](https://www.weatherapi.com/docs/)
