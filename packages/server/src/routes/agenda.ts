import { Hono } from 'hono';
import { fetchAgenda } from '../connectors/agenda.ts';
import { TTLCache } from '../cache.ts';
import type { AgendaData } from '@dashboard/shared';

const TTL = Number(process.env.CACHE_TTL_AGENDA) * 1000 || 600_000;
const cache = new TTLCache<AgendaData>(TTL);

export const agendaRoute = new Hono()
  .get('/', async (c) => {
    const cached = cache.get('agenda');
    if (cached) return c.json({ ok: true, data: cached });

    const result = await fetchAgenda();
    if (result.ok) {
      cache.set('agenda', result.data);
    }
    return c.json(result);
  })
  .post('/refresh', async (c) => {
    cache.delete('agenda');
    const result = await fetchAgenda();
    if (result.ok) {
      cache.set('agenda', result.data);
    }
    return c.json(result);
  });
