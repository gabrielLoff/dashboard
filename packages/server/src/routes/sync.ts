import { Hono } from 'hono';
import { getDb } from '../db.ts';

interface HabitRow {
  id: string;
  name: string;
  created_at: string;
  completions: string;
}

interface WatchlistRow {
  id: number;
  name: string;
  image: string | null;
  added_at: string;
}

interface LayoutRow {
  key: string;
  value: string;
}

export function createSyncRoute(): Hono {
  return new Hono()
    .get('/', (c) => {
      const db = getDb();

      const habits = db.prepare('SELECT * FROM habits').all() as HabitRow[];
      const watchlist = db.prepare('SELECT * FROM watchlist').all() as WatchlistRow[];
      const layoutRow = db.prepare("SELECT * FROM layout WHERE key = 'dashboard'").get() as LayoutRow | undefined;

      return c.json({
        ok: true,
        data: {
          habits: habits.map((h) => ({
            id: h.id,
            name: h.name,
            createdAt: h.created_at,
            completions: JSON.parse(h.completions) as Record<string, boolean>,
          })),
          watchlist: watchlist.map((w) => ({
            id: w.id,
            name: w.name,
            image: w.image ?? undefined,
            addedAt: w.added_at,
          })),
          layout: layoutRow
            ? (JSON.parse(layoutRow.value) as { order: string[]; widgets: Record<string, { size: string }> })
            : { order: ['weather', 'news', 'agenda', 'games', 'shows', 'habits'], widgets: {} },
        },
      });
    })
    .put('/habits', async (c) => {
      const body = await c.req.json() as { habits: Array<{ id: string; name: string; createdAt: string; completions: Record<string, boolean> }> };
      const db = getDb();

      const replace = db.transaction(() => {
        db.prepare('DELETE FROM habits').run();
        const insert = db.prepare('INSERT INTO habits (id, name, created_at, completions) VALUES (?, ?, ?, ?)');
        for (const h of body.habits) {
          insert.run(h.id, h.name, h.createdAt, JSON.stringify(h.completions));
        }
      });
      replace();

      return c.json({ ok: true });
    })
    .put('/watchlist', async (c) => {
      const body = await c.req.json() as { entries: Array<{ id: number; name: string; image?: string; addedAt: string }> };
      const db = getDb();

      const replace = db.transaction(() => {
        db.prepare('DELETE FROM watchlist').run();
        const insert = db.prepare('INSERT INTO watchlist (id, name, image, added_at) VALUES (?, ?, ?, ?)');
        for (const w of body.entries) {
          insert.run(w.id, w.name, w.image ?? null, w.addedAt);
        }
      });
      replace();

      return c.json({ ok: true });
    })
    .put('/layout', async (c) => {
      const body = await c.req.json() as { order: string[]; widgets: Record<string, { size: string }> };
      const db = getDb();

      const replace = db.transaction(() => {
        db.prepare("DELETE FROM layout WHERE key = 'dashboard'").run();
        db.prepare('INSERT INTO layout (key, value) VALUES (?, ?)').run(
          'dashboard',
          JSON.stringify({ order: body.order, widgets: body.widgets }),
        );
      });
      replace();

      return c.json({ ok: true });
    });
}
