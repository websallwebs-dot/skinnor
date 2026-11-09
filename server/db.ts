import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, 'skinnor.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('synchronous = NORMAL');
  }
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

export function run(sql: string, params: any[] = []): Database.RunResult {
  return getDb().prepare(sql).run(...params);
}

export function all(sql: string, params: any[] = []): any[] {
  return getDb().prepare(sql).all(...params);
}

export function get(sql: string, params: any[] = []): any {
  return getDb().prepare(sql).get(...params);
}

export function exec(sql: string): void {
  getDb().exec(sql);
}

export default { getDb, closeDb, run, all, get, exec };
