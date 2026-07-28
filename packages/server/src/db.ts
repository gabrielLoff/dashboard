import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DB_DIR = join(import.meta.dirname, '..', 'data');
const DB_PATH = join(DB_DIR, 'dashboard.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  runMigrations(db);
  return db;
}

function runMigrations(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      completions TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      image TEXT,
      added_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS layout (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}
