import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createSyncRoute } from '../src/routes/sync.ts';
import { getDb } from '../src/db.ts';

function createApp(route: ReturnType<typeof createSyncRoute>): Hono {
  return new Hono().route('/api/sync', route);
}

describe('createSyncRoute', () => {
  beforeEach(() => {
    const db = getDb();
    db.prepare('DELETE FROM habits').run();
    db.prepare('DELETE FROM watchlist').run();
    db.prepare("DELETE FROM layout WHERE key = 'dashboard'").run();
    db.prepare('DELETE FROM episode_progress').run();
  });

  describe('GET /', () => {
    it('returns empty data when tables are empty', async () => {
      const route = createSyncRoute();
      const app = createApp(route);

      const res = await app.request('/api/sync');
      const json = await res.json();

      expect(json.ok).toBe(true);
      expect(json.data.habits).toEqual([]);
      expect(json.data.watchlist).toEqual([]);
    });

    it('returns default layout when no layout stored', async () => {
      const route = createSyncRoute();
      const app = createApp(route);

      const res = await app.request('/api/sync');
      const json = await res.json();

      expect(json.data.layout.carouselOrder).toEqual(['news', 'games', 'shows', 'habits']);
    });

    it('returns habits from database', async () => {
      const db = getDb();
      db.prepare('INSERT INTO habits (id, name, created_at, completions) VALUES (?, ?, ?, ?)').run(
        'h1', 'Exercise', '2026-07-28', '{"2026-07-28":true}',
      );

      const route = createSyncRoute();
      const app = createApp(route);

      const res = await app.request('/api/sync');
      const json = await res.json();

      expect(json.data.habits).toHaveLength(1);
      expect(json.data.habits[0].id).toBe('h1');
      expect(json.data.habits[0].name).toBe('Exercise');
      expect(json.data.habits[0].completions).toEqual({ '2026-07-28': true });
    });

    it('returns watchlist from database', async () => {
      const db = getDb();
      db.prepare('INSERT INTO watchlist (id, name, image, added_at) VALUES (?, ?, ?, ?)').run(
        169, 'Breaking Bad', 'https://example.com/img.jpg', '2026-07-28T00:00:00.000Z',
      );

      const route = createSyncRoute();
      const app = createApp(route);

      const res = await app.request('/api/sync');
      const json = await res.json();

      expect(json.data.watchlist).toHaveLength(1);
      expect(json.data.watchlist[0].id).toBe(169);
      expect(json.data.watchlist[0].name).toBe('Breaking Bad');
      expect(json.data.watchlist[0].image).toBe('https://example.com/img.jpg');
    });
  });

  describe('PUT /habits', () => {
    it('replaces all habits', async () => {
      const route = createSyncRoute();
      const app = createApp(route);

      await app.request('/api/sync/habits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habits: [
            { id: 'h1', name: 'Exercise', createdAt: '2026-07-28', completions: { '2026-07-28': true } },
            { id: 'h2', name: 'Read', createdAt: '2026-07-28', completions: {} },
          ],
        }),
      });

      const db = getDb();
      const rows = db.prepare('SELECT * FROM habits').all();
      expect(rows).toHaveLength(2);
    });

    it('deletes existing habits before inserting', async () => {
      const db = getDb();
      db.prepare('INSERT INTO habits (id, name, created_at, completions) VALUES (?, ?, ?, ?)').run(
        'old', 'Old Habit', '2026-01-01', '{}',
      );

      const route = createSyncRoute();
      const app = createApp(route);

      await app.request('/api/sync/habits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habits: [{ id: 'new', name: 'New Habit', createdAt: '2026-07-28', completions: {} }],
        }),
      });

      const rows = db.prepare('SELECT * FROM habits').all() as { id: string }[];
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe('new');
    });
  });

  describe('PUT /watchlist', () => {
    it('replaces all watchlist entries', async () => {
      const route = createSyncRoute();
      const app = createApp(route);

      await app.request('/api/sync/watchlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: [
            { id: 169, name: 'Breaking Bad', image: 'https://example.com/img.jpg', addedAt: '2026-07-28T00:00:00.000Z' },
          ],
        }),
      });

      const db = getDb();
      const rows = db.prepare('SELECT * FROM watchlist').all();
      expect(rows).toHaveLength(1);
    });
  });

  describe('PUT /layout', () => {
    it('stores carousel order as JSON', async () => {
      const route = createSyncRoute();
      const app = createApp(route);

      await app.request('/api/sync/layout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carouselOrder: ['habits', 'news', 'games', 'shows'],
        }),
      });

      const db = getDb();
      const row = db.prepare("SELECT * FROM layout WHERE key = 'dashboard'").get() as { value: string };
      const parsed = JSON.parse(row.value);
      expect(parsed.carouselOrder).toEqual(['habits', 'news', 'games', 'shows']);
    });

    it('replaces existing layout', async () => {
      const db = getDb();
      db.prepare("INSERT INTO layout (key, value) VALUES (?, ?)").run(
        'dashboard', JSON.stringify({ carouselOrder: ['old'] }),
      );

      const route = createSyncRoute();
      const app = createApp(route);

      await app.request('/api/sync/layout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carouselOrder: ['new'],
        }),
      });

      const rows = db.prepare("SELECT * FROM layout WHERE key = 'dashboard'").all();
      expect(rows).toHaveLength(1);
    });
  });

  describe('GET / (progress)', () => {
    it('returns empty progress when table is empty', async () => {
      const route = createSyncRoute();
      const app = createApp(route);

      const res = await app.request('/api/sync');
      const json = await res.json();

      expect(json.data.progress).toEqual([]);
    });

    it('returns progress from database', async () => {
      const db = getDb();
      db.prepare('INSERT INTO episode_progress (show_id, show_name, season, episode, watched_at) VALUES (?, ?, ?, ?, ?)').run(
        46562, 'The Last of Us', 3, 5, '2026-07-28T12:00:00.000Z',
      );

      const route = createSyncRoute();
      const app = createApp(route);

      const res = await app.request('/api/sync');
      const json = await res.json();

      expect(json.data.progress).toHaveLength(1);
      expect(json.data.progress[0].showId).toBe(46562);
      expect(json.data.progress[0].showName).toBe('The Last of Us');
      expect(json.data.progress[0].season).toBe(3);
      expect(json.data.progress[0].episode).toBe(5);
      expect(json.data.progress[0].watchedAt).toBe('2026-07-28T12:00:00.000Z');
    });
  });

  describe('PUT /progress', () => {
    it('replaces all progress entries', async () => {
      const route = createSyncRoute();
      const app = createApp(route);

      await app.request('/api/sync/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress: [
            { showId: 46562, showName: 'The Last of Us', season: 3, episode: 5, watchedAt: '2026-07-28T12:00:00.000Z' },
            { showId: 690, showName: 'Stranger Things', season: 4, episode: 9, watchedAt: '2026-07-28T10:00:00.000Z' },
          ],
        }),
      });

      const db = getDb();
      const rows = db.prepare('SELECT * FROM episode_progress').all();
      expect(rows).toHaveLength(2);
    });

    it('deletes existing progress before inserting', async () => {
      const db = getDb();
      db.prepare('INSERT INTO episode_progress (show_id, show_name, season, episode, watched_at) VALUES (?, ?, ?, ?, ?)').run(
        169, 'Breaking Bad', 5, 16, '2026-01-01T00:00:00.000Z',
      );

      const route = createSyncRoute();
      const app = createApp(route);

      await app.request('/api/sync/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress: [
            { showId: 46562, showName: 'The Last of Us', season: 3, episode: 5, watchedAt: '2026-07-28T12:00:00.000Z' },
          ],
        }),
      });

      const rows = db.prepare('SELECT * FROM episode_progress').all() as { show_id: number }[];
      expect(rows).toHaveLength(1);
      expect(rows[0].show_id).toBe(46562);
    });

    it('handles empty progress array', async () => {
      const route = createSyncRoute();
      const app = createApp(route);

      await app.request('/api/sync/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: [] }),
      });

      const db = getDb();
      const rows = db.prepare('SELECT * FROM episode_progress').all();
      expect(rows).toHaveLength(0);
    });
  });
});
