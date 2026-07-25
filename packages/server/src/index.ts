import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { weatherRoute } from './routes/weather.ts';
import { newsRoute } from './routes/news.ts';
import { agendaRoute } from './routes/agenda.ts';
import { gamesRoute } from './routes/games.ts';

const app = new Hono();

app.use('*', cors({ origin: 'http://localhost:5173' }));

app.get('/api/health', (c) => c.json({ status: 'ok', mock: process.env.MOCK !== 'false' }));

app.route('/api/weather', weatherRoute);
app.route('/api/news', newsRoute);
app.route('/api/agenda', agendaRoute);
app.route('/api/games', gamesRoute);

const port = Number(process.env.PORT) || 3001;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`BFF server running on http://localhost:${info.port} (MOCK=${process.env.MOCK !== 'false'})`);
});
