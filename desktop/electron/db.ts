import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db: Database.Database

export function initDb() {
  const dbPath = path.join(app.getPath('userData'), 'xiaoheishu.db')
  db = new Database(dbPath)
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      title_en TEXT,
      content TEXT NOT NULL,
      content_en TEXT,
      city TEXT,
      tags TEXT DEFAULT '[]',
      images TEXT DEFAULT '[]',
      cover_image TEXT,
      status TEXT DEFAULT 'draft',
      published_platforms TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `)
  return db
}

export function getDb(): Database.Database {
  return db
}
