import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { weatherRoute } from './routes/weather.ts';
import { newsRoute } from './routes/news.ts';
import { agendaRoute } from './routes/agenda.ts';
import { gamesRoute } from './routes/games.ts';
import { getAccessToken } from './lib/google-auth.ts';

type CalendarStatus = 'connected' | 'missing-refresh-token';

let calendarStatus: CalendarStatus = 'missing-refresh-token';

const app = new Hono();

app.use('*', cors({ origin: 'http://localhost:5173' }));

app.get('/api/health', (c) =>
  c.json({
    status: 'ok',
    mock: process.env.MOCK !== 'false',
    calendar: calendarStatus,
  }),
);

app.route('/api/weather', weatherRoute);
app.route('/api/news', newsRoute);
app.route('/api/agenda', agendaRoute);
app.route('/api/games', gamesRoute);

const port = Number(process.env.PORT) || 3001;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(
    `BFF server running on http://localhost:${info.port} (MOCK=${process.env.MOCK !== 'false'})`,
  );
});

getAccessToken()
  .then(() => {
    calendarStatus = 'connected';
    console.log('Google Calendar: connected');
  })
  .catch((e: unknown) => {
    calendarStatus = 'missing-refresh-token';
    console.log(
      `Google Calendar: refresh token invalid — widget will show errors (${String(e)})`,
    );
  });
