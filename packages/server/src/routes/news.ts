import { createCachedRoute } from './cached-route.ts';
import { fetchNews } from '../connectors/news.ts';

const TTL = Number(process.env.CACHE_TTL_NEWS) * 1000 || 900_000;

export const newsRoute = createCachedRoute(
  (_ctx) => fetchNews(),
  TTL,
  () => 'news',
);