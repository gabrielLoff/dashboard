# Free Weather APIs for Personal Dashboard

## Summary

**Open-Meteo is the best choice for this personal dashboard.** It requires no API key, no sign-up, and no credit card — just HTTP GET requests. 10,000 free daily calls is overkill for a dashboard refreshing a few times per hour, and data quality is top-notch (aggregates 30+ national weather service models). OpenWeatherMap's current free tier is also genuinely free (no credit card, 1M calls/month) and already implemented, but the API key requirement adds a sign-up friction Open-Meteo eliminates entirely.

## API comparisons

### Open-Meteo

- **Free tier**: Non-commercial use, 10,000 daily API calls. No credit card, no sign-up, no API key.
- **Auth**: None required for non-commercial use. Optional `apikey` param for commercial/paid plans.
- **Rate limits**: 10,000 calls/day for non-commercial use. No per-minute cap documented. Fair-use policy.
- **Data format**: JSON via HTTP GET. Coordinates-based (lat/lon required). Also supports CSV and XLSX.
- **Current weather**: Available via `current=` parameter on the forecast endpoint (`/v1/forecast`). Returns `temperature_2m`, `relative_humidity_2m`, `apparent_temperature`, `wind_speed_10m`, `wind_direction_10m`, `weather_code`, `is_day`, `precipitation`, and more. Model-derived current conditions (15-minutely data for Europe/North America, hourly elsewhere).
- **Geocoding**: Separate free endpoint at `https://geocoding-api.open-meteo.com/v1/search` — converts city name to lat/lon, no key required.
- **Data freshness**: Model updates every 1–3 hours for high-res regional models, every 6 hours for global models.
- **Attribution required**: CC BY 4.0 — must credit Open-Meteo and the underlying national weather services.
- **Data sources**: ECMWF, NOAA, DWD, Meteo-France, JMA, KMA, UK Met Office, and ~10 more national services. Resolution 1–11 km.
- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Verdict**: **Best choice.** Zero-auth, high quality, massive rate limit. The coordinates-only interface requires an extra geocoding call, but Open-Meteo provides that for free too. Ideal for a personal dashboard.

### OpenWeatherMap

- **Free tier**: "Free Weather API access" plan — 60 calls/minute, 1,000,000 calls/month. Current weather, 5-day/3-hour forecast, geocoding, air pollution, weather maps. No credit card required. Email sign-up needed.
- **Auth**: API key (`appid` parameter) required on every request. Generated immediately after email verification.
- **Rate limits**: 60 calls/min, 1,000,000 calls/month. Overage may trigger email warning, then suspension.
- **Data format**: JSON, XML, or HTML via HTTP GET. Supports city name or coordinates in query.
- **Data freshness**: Real-time station observations + model data. Updates every few minutes for station data.
- **Attribution required**: Yes — link back to OpenWeather.
- **Endpoint** (current weather): `https://api.openweathermap.org/data/2.5/weather`
- **One Call API note**: One Call 3.0/4.0 is a separate pay-per-call product (first 1,000 calls/day free, then billed). The current connector uses the free `/data/2.5/weather` endpoint, NOT One Call, so it avoids billing.
- **Verdict**: **Good.** Already implemented and works. Free tier is genuinely free with no credit card. City-name lookup without extra geocoding step. The API key sign-up is the only friction.

### WeatherAPI.com

- **Free tier**: 100,000 calls/month. Real-time weather, 3-day forecast, 1-day history. No credit card required.
- **Auth**: API key required. Instant generation after sign-up.
- **Rate limits**: 1M calls/month (free tier has 100K). Hard cap — overage blocks requests until next month reset.
- **Data format**: JSON or XML via HTTP GET. Supports city name, lat/lon, ZIP, IP, or UK postcode.
- **Data freshness**: Real-time station data. 200ms average response time.
- **Attribution required**: Appreciated but not strictly enforced for free plan.
- **Verdict**: **Solid alternative.** 100K calls/month is generous, supports city names, and has good data quality. Requires an API key but no credit card. Comparable to OpenWeatherMap in ease of use.

### Weatherstack

- **Free tier**: 100 calls/month. Real-time weather only. HTTPS encryption.
- **Auth**: API key required.
- **Rate limits**: 100 calls/month (less than 4 per day). Overage charges apply automatically at $0.0008+ per call, which means any small mistake can incur unexpected billing. No hard cap — billing continues.
- **Data format**: JSON via HTTP GET.
- **Data freshness**: Real-time weather data.
- **Attribution required**: Not found in docs.
- **Verdict**: **Not suitable.** 100 calls/month is unusably low for a dashboard (even refreshing once per hour exceeds it). The automatic overage billing is a risk. Skip.

### Tomorrow.io

- **Free tier**: 500 calls/day, 25 calls/hour, 3 calls/second. Core weather parameters (temperature, wind, precipitation, humidity). No credit card required.
- **Auth**: API key required.
- **Rate limits**: 500/day, 25/hour, 3/sec. No weekly/monthly caps beyond these.
- **Data format**: JSON via HTTP GET.
- **Data freshness**: Real-time + forecast.
- **Attribution required**: Not prominently documented for free tier.
- **Verdict**: **Adequate but limited.** 25 calls/hour means at most one refresh every ~2.4 minutes. 500/day is fine for a personal dashboard. The API key requirement and limited free-tier parameters make it less compelling than Open-Meteo or OpenWeatherMap.

### National Weather Service (weather.gov) — US only

- **Free tier**: Unlimited, completely free for any use. No API key, no sign-up.
- **Auth**: None. `User-Agent` header required for identification.
- **Rate limits**: Not publicly documented; generous but enforced to prevent abuse.
- **Data format**: JSON-LD via HTTP GET. US locations only.
- **Verdict**: **Not applicable** — this dashboard needs global location support.

### docs.weather-api.site (keyless API)

- **Free tier**: Free, no API key, no sign-up. Current conditions, hourly, 16-day forecast.
- **Auth**: None.
- **Rate limits**: Not documented. Unknown reliability.
- **Verdict**: **Interesting but unproven.** New/small project with undocumented limits and unknown sustainability. Not recommended for a production dashboard.

## Recommendation

**Switch from OpenWeatherMap to Open-Meteo.** The current connector at `packages/server/src/connectors/weather.ts` should be rewritten to use Open-Meteo's free API instead.

### Rationale

| Factor | Open-Meteo | OpenWeatherMap (current) |
|---|---|---|
| Sign-up required | None | Email sign-up |
| API key | None | Yes (`OPENWEATHER_API_KEY`) |
| Credit card | No | No |
| Daily call limit | 10,000 | ~33,000 (1M/month) |
| City-name lookup | Needs geocoding call | Built-in (`q=` param) |
| Data quality | Multi-model ensemble | Station + model mix |
| Attribution | CC BY 4.0 | Link back |

The only downside is that Open-Meteo requires coordinates, not city names. This means one extra API call (geocoding) before fetching weather. Since both APIs are keyless and free, this adds no friction.

### Connector changes needed

1. **Replace the endpoint** — change from `api.openweathermap.org/data/2.5/weather` to `api.open-meteo.com/v1/forecast` with `current=` parameters.
2. **Add geocoding** — call `https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=1` to resolve city name to lat/lon before the weather call.
3. **Remap response fields**:
   - `json.main.temp` → `current.temperature_2m`
   - `json.main.feels_like` → `current.apparent_temperature`
   - `json.main.humidity` → `current.relative_humidity_2m`
   - `json.weather[0].description` → mapped from `current.weather_code` (WMO codes)
   - `json.wind.speed` → `current.wind_speed_10m`
   - `json.name` → geocoding result `name`
   - `json.weather[0].icon` → no icon URL from Open-Meteo; generate from weather_code locally or use an icon mapping
4. **Remove env variable** — `OPENWEATHER_API_KEY` is no longer needed. Remove from `.env.example` and connector code.
5. **Update cache TTL** — Open-Meteo model data updates every 1–6 hours. The current 10-minute cache TTL (`CACHE_TTL_WEATHER=600`) is still reasonable as a refresh interval.
6. **Update mock data** — no changes needed, mock data interface remains the same.

### Example Open-Meteo request flow

```
Step 1 — Geocoding:
GET https://geocoding-api.open-meteo.com/v1/search?name=Porto+Alegre&count=1
→ { results: [{ latitude: -30.03, longitude: -51.23, name: "Porto Alegre", ... }] }

Step 2 — Weather:
GET https://api.open-meteo.com/v1/forecast?latitude=-30.03&longitude=-51.23&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,weather_code,precipitation,cloud_cover
→ { current: { temperature_2m: 22.4, relative_humidity_2m: 65, apparent_temperature: 20.1, wind_speed_10m: 12.3, weather_code: 3, ... } }
```

### WMO weather code → condition text mapping (subset)

| Code | Condition |
|---|---|
| 0 | Clear sky |
| 1 | Mainly clear |
| 2 | Partly cloudy |
| 3 | Overcast |
| 45, 48 | Fog |
| 51, 53, 55 | Drizzle |
| 61, 63, 65 | Rain |
| 71, 73, 75 | Snow |
| 80, 81, 82 | Rain showers |
| 95, 96, 99 | Thunderstorm |

### .env.example changes

```diff
- OPENWEATHER_API_KEY=
+ # No API key needed — Open-Meteo is keyless
```

## Sources

- [Open-Meteo Homepage](https://open-meteo.com/) — free tier details, features
- [Open-Meteo Weather Forecast API Docs](https://open-meteo.com/en/docs) — endpoint, parameters, variables
- [Open-Meteo Geocoding API Docs](https://open-meteo.com/en/docs/geocoding-api) — city name search
- [Open-Meteo GitHub](https://github.com/open-meteo/open-meteo) — open-source license (AGPLv3)
- [OpenWeatherMap Pricing](https://openweathermap.org/price) — free tier: 60 calls/min, 1M calls/month
- [OpenWeatherMap FAQ](https://openweathermap.org/faq) — API key activation, limits
- [OpenWeatherMap Free Tier Limits 2026 — APIScout](https://apiscout.dev/guides/openweathermap-free-tier-limits-2026) — detailed free tier breakdown, One Call vs Free Weather API
- [WeatherAPI.com Pricing](https://www.weatherapi.com/pricing.aspx) — free tier: 100K calls/month, no credit card
- [WeatherAPI.com Docs](https://www.weatherapi.com/docs/) — endpoints, error codes
- [Weatherstack Pricing](https://weatherstack.com/pricing) — free tier: 100 calls/month, overage billing
- [Tomorrow.io Free API Rate Limits](https://support.tomorrow.io/hc/en-us/articles/20273728362644-Free-API-Plan-Rate-Limits) — 500/day, 25/hour, 3/sec
- [National Weather Service API](https://www.weather.gov/documentation/services-web-api) — keyless, US-only, public domain
- [docs.weather-api.site](https://docs.weather-api.site/) — keyless API, unknown reliability
