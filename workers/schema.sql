-- Xiaoheishu D1 Schema

CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  username    TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  display_name_en TEXT,
  password_hash TEXT NOT NULL,        -- format: sha256:<hex>
  bio         TEXT,
  bio_en      TEXT,
  avatar_url  TEXT,
  city        TEXT,
  active      INTEGER DEFAULT 1,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  slug        TEXT NOT NULL,
  title       TEXT NOT NULL,
  title_en    TEXT,
  content     TEXT NOT NULL,          -- markdown
  content_en  TEXT,                   -- english markdown
  cover_image TEXT,                   -- primary image URL
  images      TEXT DEFAULT '[]',      -- JSON array of image URLs
  tags        TEXT DEFAULT '[]',      -- JSON array
  city        TEXT,
  published   INTEGER DEFAULT 1,
  geo_quotes  TEXT DEFAULT '[]',      -- JSON array of quotable statements
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id, published);
CREATE INDEX IF NOT EXISTS idx_posts_city ON posts(city);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
