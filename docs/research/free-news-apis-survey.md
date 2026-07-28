# Free News APIs for Dashboard Integration

## Summary

We surveyed eight free news API providers suitable for a dashboard news widget. All offer no-credit-card free tiers with varying daily request limits (100–1,000 req/day), JSON REST endpoints, and category/country/language filtering. The strongest candidates for this project are **NewsAPI.org** (largest source network, most mature), **Currents API** (generous 1,000 req/day free tier), and **The News API** (fully free with no credit card).

## Findings

### NewsAPI.org
The most widely used news API. Returns JSON from 150,000+ sources in 14 languages across 55 countries. Free for development with no credit card required. Offers `/v2/everything` (keyword search with date ranges) and `/v2/top-headlines` (country/category filtering). Supports boolean operators, publisher filtering, and language filtering. Trusted by 500,000+ developers.

**Source:** [NewsAPI.org](https://newsapi.org/) — "Locate articles and breaking news headlines from news sources and blogs across the web with our JSON API"

### The News API (thenewsapi.com)
100% free on the free plan with no payment details required. Provides top stories, real-time news feeds, and historical data from 40,000+ sources in 50+ countries. Indexes 1M+ new articles weekly. RESTful endpoints: `/v1/news/top`, `/v1/news/all`, `/v1/news/headlines`. Supports full-text search with advanced operators (AND/OR/NOT), locale/category/source filtering, and pagination up to 20,000 results.

**Source:** [The News API](https://www.thenewsapi.com/) — "Our service is 100% free to use on our free plan — no payment details are required."

### Currents API
Generous free tier of 1,000 requests per day — no credit card needed. JSON responses with titles, source URLs, languages, categories, images, and timestamps. Two endpoints: Latest News (by country/language/category) and Search (keyword + date range). Designed for prototypes, dashboards, and low-volume apps. Paid plans at $69/mo (Builder) and $150/mo (Professional).

**Source:** [Currents Free News API](https://currentsapi.services/en/free-news-api) — "Get a free API key, make your first JSON news request, and test up to 1,000 requests per day before choosing a paid quota."

### GNews API
Real-time news from 80,000+ sources in 41 languages across 71 countries. Free tier: 100 requests/day, up to 10 articles per request, 12-hour delay, 30 days historical data, CORS enabled for localhost. Two endpoints: `/api/v4/search` (keyword + filters) and `/api/v4/top-headlines` (category + country). 100M+ articles indexed, historical archive back to 2020. SDKs for JS, TypeScript, PHP, Python.

**Source:** [GNews API](https://gnews.io/) — "Start on the free tier instantly, no credit card needed."

### NewsData.io
Provides real-time and historical news with full article content, sentiment analysis, and region-based filtering. Free plan available for development and testing. Claims more news coverage than NewsAPI.org with less noise via real-time clustering. Supports CSV/XLSX export alongside JSON API. Budget-friendly compared to competitors.

**Source:** [NewsData.io](https://newsdata.io/) — "Unlock complimentary access to the NewsData.io API, empowering you to seamlessly develop and test your projects."

### APITube
1,000 requests/day on the free tier with no credit card. Access to 500,000+ sources in 177 countries and 60 languages. Provides full article content, sentiment analysis, topic classification, and entity extraction — features that other APIs reserve for paid tiers. 65+ query filters. SDKs for Python, JavaScript, PHP, Java, Go, Ruby, Swift, Kotlin, and 20+ languages. 3.8 billion total articles indexed.

**Source:** [APITube Free News API](https://apitube.io/free-news-api) — "APITube offers a free version as 1,000 requests per day — no credit card. And access the same 500,000+ sources, NLP enrichment and 65+ Filters."

### FreeNewsAPI (freenewsapi.com)
100 requests/day on the free plan with up to 5 articles per request. Real-time data with 7 days of historical lookback. Includes sentiment analysis, full article content, pagination, and Excel/CSV export. Free plan is for non-commercial projects and development/testing only.

**Source:** [FreeNewsAPI](https://freenewsapi.com/) — "Get free access to the API for use in your project. No credit card required!"

### NewsCatcher API (Free Tier)
Free API for non-commercial use cases via RapidAPI. No credit card required. Provides a single `/v1/search` endpoint with keyword and date filtering. Designed for developers, indie builders, and students who need reliable news data without worrying about trial limits.

**Source:** [NewsCatcher Free Docs](https://free-docs.newscatcherapi.com/) — "This is an absolutely free API for all your non-commercial use cases! No credit card required to subscribe."

## Comparison Table

| API | Free Req/Day | Sources | Credit Card | Commercial Use | Full Content |
|---|---|---|---|---|---|
| NewsAPI.org | Developer trial | 150K+ | No | Trial only | Snippets |
| The News API | Unlimited* | 40K+ | No | Yes | Snippets |
| Currents API | 1,000 | 70+ countries | No | Testing only | Snippets |
| GNews API | 100 | 80K+ | No | No | Snippets (12h delay) |
| NewsData.io | Limited | Wide | No | Testing only | Full |
| APITube | 1,000 | 500K+ | No | Yes | Full |
| FreeNewsAPI | 100 | Wide | No | No | Full |
| NewsCatcher | Free tier | Wide | No | No | Snippets |

*\* The News API states "100% free" but has undocumented rate limits.*

## Recommendation

For a dashboard widget with moderate usage (periodic headline refresh every 5–15 minutes), **Currents API** (1,000 req/day) or **The News API** (free, no card) are the best starting points. If full article content or sentiment analysis is needed, **APITube** provides the most generous free tier with rich NLP features.

## Sources
- [NewsAPI.org](https://newsapi.org/)
- [The News API](https://www.thenewsapi.com/)
- [Currents API](https://currentsapi.services/en/free-news-api)
- [GNews API](https://gnews.io/)
- [NewsData.io](https://newsdata.io/)
- [APITube](https://apitube.io/free-news-api)
- [FreeNewsAPI](https://freenewsapi.com/)
- [NewsCatcher Free API](https://free-docs.newscatcherapi.com/)
