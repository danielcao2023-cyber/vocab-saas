import Database from 'better-sqlite3';
import fs from 'node:fs';
import { recomputeDailyStats } from './stats.ts';

export type DB = Database.Database;

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY,
  headword TEXT NOT NULL,
  phonetic TEXT,
  pos TEXT,
  meaning_zh TEXT,
  meaning_raw TEXT,
  meaning_flag TEXT,
  meaning_source TEXT,
  ecdict_key TEXT,
  entry_raw TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL,          -- 词表标识，如 kb2022 / sample
  level TEXT,                    -- 课标级别：二级 / 三级（初中）等
  unit TEXT,                     -- 九年级单元，第一期留空
  freq_rank INTEGER,
  is_sample INTEGER NOT NULL DEFAULT 0,
  UNIQUE(source, headword)
);
CREATE TABLE IF NOT EXISTS word_content (
  id INTEGER PRIMARY KEY,
  word_id INTEGER NOT NULL REFERENCES words(id),
  kind TEXT NOT NULL,            -- example / mnemonic / quiz
  body_json TEXT NOT NULL,
  model TEXT, prompt_version TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','generated','review','approved')),
  reviewed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS content_feedback (
  id INTEGER PRIMARY KEY,
  word_id INTEGER NOT NULL REFERENCES words(id),
  content_version TEXT,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY,
  word_id INTEGER NOT NULL REFERENCES words(id),
  mode TEXT NOT NULL CHECK (mode IN ('recognize','spell','dictation')),
  due TEXT NOT NULL, stability REAL NOT NULL, difficulty REAL NOT NULL,
  elapsed_days INTEGER NOT NULL, scheduled_days INTEGER NOT NULL, learning_steps INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL, lapses INTEGER NOT NULL, state INTEGER NOT NULL, last_review TEXT,
  UNIQUE(word_id, mode)
);
CREATE INDEX IF NOT EXISTS idx_cards_due ON cards(due);
CREATE TABLE IF NOT EXISTS review_logs (
  id INTEGER PRIMARY KEY,
  card_id INTEGER NOT NULL REFERENCES cards(id),
  rating INTEGER NOT NULL, state INTEGER NOT NULL, due TEXT NOT NULL,
  stability REAL NOT NULL, difficulty REAL NOT NULL, elapsed_days INTEGER NOT NULL, scheduled_days INTEGER NOT NULL,
  review_at TEXT NOT NULL, duration_ms INTEGER, answer TEXT, correct INTEGER
);
CREATE TABLE IF NOT EXISTS wrong_words (
  word_id INTEGER PRIMARY KEY REFERENCES words(id),
  wrong_count INTEGER NOT NULL DEFAULT 0,
  last_wrong_at TEXT NOT NULL,
  correct_days TEXT NOT NULL DEFAULT '[]', -- 加入后答对的不同日期（上海时间）
  removed_at TEXT
);
CREATE TABLE IF NOT EXISTS ai_jobs (id INTEGER PRIMARY KEY, kind TEXT, payload_hash TEXT, status TEXT, attempts INTEGER DEFAULT 0, error TEXT, started_at TEXT, finished_at TEXT);
CREATE TABLE IF NOT EXISTS ai_cache (key_hash TEXT PRIMARY KEY, word_id INTEGER, question TEXT, answer TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT OR IGNORE INTO settings(key,value) VALUES ('new_per_day','10'),('review_limit','200'),('level2_every','5');
`;

function addColumn(db: DB, table: string, col: string, def: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
}

export function openDb(file: string, options: { dryRun?: boolean } = {}): DB {
  let db: DB;
  if (options.dryRun && file !== ':memory:' && fs.existsSync(file)) {
    const original = new Database(file, { readonly: true });
    let copy: Buffer;
    try { copy = original.serialize(); } finally { original.close(); }
    // WAL 模式的库头部 18/19 字节为 2，反序列化到内存时无法以 WAL 打开（SQLITE_CANTOPEN）；改成回滚日志模式（只改内存副本）
    if (copy.length >= 100) { copy[18] = 1; copy[19] = 1; }
    db = new Database(copy);
  } else {
    db = new Database(options.dryRun ? ':memory:' : file);
  }
  try {
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(SCHEMA);
    // 轻量迁移
    addColumn(db, 'words', 'meaning_raw', 'TEXT');      // ECDICT 原始 translation，不改动
    addColumn(db, 'words', 'meaning_flag', 'TEXT');     // '释义待人工看'
    addColumn(db, 'words', 'meaning_source', 'TEXT');
    addColumn(db, 'words', 'ecdict_key', 'TEXT');
    addColumn(db, 'words', 'entry_raw', 'TEXT');
    addColumn(db, 'words', 'priority', 'INTEGER NOT NULL DEFAULT 0');
    addColumn(db, 'review_logs', 'answer_id', 'TEXT');  // 客户端幂等键
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_logs_answer_id ON review_logs(answer_id) WHERE answer_id IS NOT NULL');
    addColumn(db, 'review_logs', 'qtype', 'TEXT');
    addColumn(db, 'review_logs', 'counted', 'INTEGER');
    addColumn(db, 'review_logs', 'context', 'TEXT');
    db.exec(`CREATE TABLE IF NOT EXISTS question_issues (
      id INTEGER PRIMARY KEY, card_id INTEGER NOT NULL REFERENCES cards(id),
      qtype TEXT NOT NULL, context TEXT NOT NULL DEFAULT 'study', options_json TEXT NOT NULL,
      answer_word_id INTEGER NOT NULL, issued_at TEXT NOT NULL,
      answered_at TEXT, chosen_word_id INTEGER, answer_id TEXT);
      CREATE INDEX IF NOT EXISTS idx_question_open ON question_issues(card_id,context,issued_at) WHERE answered_at IS NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_question_answer ON question_issues(answer_id) WHERE answer_id IS NOT NULL;
      CREATE TABLE IF NOT EXISTS daily_stats (
        day TEXT PRIMARY KEY, new_count INTEGER NOT NULL, review_count INTEGER NOT NULL, practice_count INTEGER NOT NULL,
        answers INTEGER NOT NULL, correct INTEGER NOT NULL, duration_ms INTEGER NOT NULL,
        mastered_new INTEGER NOT NULL, completed INTEGER NOT NULL, completed_at TEXT, computed_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS streak_makeups (day TEXT PRIMARY KEY, used_at TEXT NOT NULL);
      INSERT OR IGNORE INTO settings(key,value) VALUES ('choice_enabled','1'),('choice_weights','1,1,1'),
        ('makeup_per_month','2'),('makeup_window_days','7'),('makeup_requires_today','1'),('duration_cap_ms','300000');`);
    recomputeDailyStats(db);
    return db;
  } catch (error) { db.close(); throw error; }
}
