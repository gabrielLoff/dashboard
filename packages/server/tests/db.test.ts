import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = join(import.meta.dirname, '..', 'src', 'data');

function cleanDataDir(): void {
  if (existsSync(DATA_DIR)) {
    rmSync(DATA_DIR, { recursive: true, force: true });
  }
}

describe('getDb', () => {
  beforeEach(() => {
    cleanDataDir();
  });

  afterEach(() => {
    cleanDataDir();
  });

  it('creates habits table', async () => {
    const { getDb } = await import('../src/db.ts');
    const db = getDb();
    const table = db.prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='habits'",
    ).get() as { sql: string } | undefined;
    expect(table).toBeDefined();
    expect(table?.sql).toContain('habits');
  });

  it('creates watchlist table', async () => {
    const { getDb } = await import('../src/db.ts');
    const db = getDb();
    const table = db.prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='watchlist'",
    ).get() as { sql: string } | undefined;
    expect(table).toBeDefined();
    expect(table?.sql).toContain('watchlist');
  });

  it('creates layout table', async () => {
    const { getDb } = await import('../src/db.ts');
    const db = getDb();
    const table = db.prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='layout'",
    ).get() as { sql: string } | undefined;
    expect(table).toBeDefined();
    expect(table?.sql).toContain('layout');
  });

  it('returns the same instance on repeated calls', async () => {
    const { getDb } = await import('../src/db.ts');
    const db1 = getDb();
    const db2 = getDb();
    expect(db1).toBe(db2);
  });

  it('is idempotent — calling getDb twice does not error', async () => {
    const { getDb } = await import('../src/db.ts');
    getDb();
    expect(() => getDb()).not.toThrow();
  });

  it('enables WAL mode', async () => {
    const { getDb } = await import('../src/db.ts');
    const db = getDb();
    const mode = db.pragma('journal_mode', { simple: true }) as string;
    expect(mode).toBe('wal');
  });

  it('can insert and query habits', async () => {
    const { getDb } = await import('../src/db.ts');
    const db = getDb();
    db.prepare('DELETE FROM habits WHERE id = ?').run('test-habit');
    db.prepare('INSERT INTO habits (id, name, created_at, completions) VALUES (?, ?, ?, ?)').run(
      'test-habit', 'Exercise', '2026-07-28', '{}',
    );
    const row = db.prepare('SELECT * FROM habits WHERE id = ?').get('test-habit') as { name: string };
    expect(row.name).toBe('Exercise');
    db.prepare('DELETE FROM habits WHERE id = ?').run('test-habit');
  });
});
