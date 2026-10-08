import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

// READUP_DATA_DIR lets you keep the data somewhere else (a volume in production, a temp dir in tests).
export const DATA_DIR = process.env.READUP_DATA_DIR || path.join(process.cwd(), 'data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

function init() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = new Database(path.join(DATA_DIR, 'readup.db'));
  db.pragma('busy_timeout = 10000'); // several processes may open the file at once (e.g. during `next build`)
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('teacher','student')),
      level TEXT NOT NULL DEFAULT 'B1',
      native_lang TEXT NOT NULL DEFAULT '',
      daily_goal INTEGER NOT NULL DEFAULT 30,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      level TEXT NOT NULL,
      topic TEXT NOT NULL DEFAULT 'General',
      summary TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL,
      body_simple TEXT NOT NULL DEFAULT '',
      audio_file TEXT,
      glossary TEXT NOT NULL DEFAULT '[]',
      lang_quiz TEXT NOT NULL DEFAULT '[]',
      comp_quiz TEXT NOT NULL DEFAULT '[]',
      writing_prompt TEXT NOT NULL DEFAULT '',
      word_count INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    -- One row per article a student has finished reading (first finish wins; re-reads update wpm).
    CREATE TABLE IF NOT EXISTS reads (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      seconds INTEGER NOT NULL,
      wpm INTEGER NOT NULL,
      mode TEXT NOT NULL DEFAULT 'original',
      finished_at TEXT NOT NULL,
      PRIMARY KEY (user_id, article_id)
    );
    CREATE TABLE IF NOT EXISTS views (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      opened_at TEXT NOT NULL,
      opens INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (user_id, article_id)
    );
    CREATE TABLE IF NOT EXISTS bookmarks (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, article_id)
    );
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('lang','comp')),
      score INTEGER NOT NULL,
      max INTEGER NOT NULL,
      answers TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS saved_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      word TEXT NOT NULL,
      definition TEXT NOT NULL DEFAULT '',
      translation TEXT NOT NULL DEFAULT '',
      example TEXT NOT NULL DEFAULT '',
      own_sentence TEXT NOT NULL DEFAULT '',
      article_id INTEGER REFERENCES articles(id) ON DELETE SET NULL,
      box INTEGER NOT NULL DEFAULT 0,
      due INTEGER NOT NULL,
      reviews INTEGER NOT NULL DEFAULT 0,
      added_at TEXT NOT NULL,
      UNIQUE (user_id, word)
    );
    CREATE TABLE IF NOT EXISTS activity_days (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      day TEXT NOT NULL,
      xp INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, day)
    );
    CREATE TABLE IF NOT EXISTS writings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      feedback TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lookup_cache (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
  // Columns added after the first release (safe on an existing database).
  if (!db.prepare('PRAGMA table_info(articles)').all().some((c) => c.name === 'writing_prompt')) {
    db.exec("ALTER TABLE articles ADD COLUMN writing_prompt TEXT NOT NULL DEFAULT ''");
  }
  if (!db.prepare('PRAGMA table_info(saved_words)').all().some((c) => c.name === 'own_sentence')) {
    db.exec("ALTER TABLE saved_words ADD COLUMN own_sentence TEXT NOT NULL DEFAULT ''");
  }
  // Classes and assignments were removed; drop their tables from older databases.
  db.exec('DROP TABLE IF EXISTS assignments; DROP TABLE IF EXISTS class_members; DROP TABLE IF EXISTS classes;');
  return db;
}

// Reuse one connection across hot reloads in dev.
export const db = (globalThis.__readupDb ??= init());
