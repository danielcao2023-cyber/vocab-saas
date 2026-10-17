
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

ALTER TABLE review_logs ADD COLUMN answer_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_logs_answer_id ON review_logs(answer_id) WHERE answer_id IS NOT NULL;
