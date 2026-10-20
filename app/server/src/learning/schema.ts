import type {DB} from '../db.ts';
export function migrateLearning(db:DB){db.exec(`
CREATE TABLE IF NOT EXISTS learning_words (
 word_id INTEGER PRIMARY KEY REFERENCES words(id),book TEXT NOT NULL CHECK(book IN ('new','unfamiliar','familiar','mastered')),
 introduced_at TEXT NOT NULL,last_at TEXT,initial_done INTEGER NOT NULL DEFAULT 0,initial_errors INTEGER NOT NULL DEFAULT 0,
 error_day TEXT NOT NULL DEFAULT '',day_errors INTEGER NOT NULL DEFAULT 0,last_fail TEXT,due TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS learning_days (day TEXT PRIMARY KEY,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS learning_day_words (
 day TEXT NOT NULL REFERENCES learning_days(day),word_id INTEGER NOT NULL REFERENCES words(id),position INTEGER NOT NULL,
 initial_book TEXT NOT NULL,is_new INTEGER NOT NULL,targets TEXT NOT NULL,streaks TEXT NOT NULL DEFAULT '[0,0,0]',
 errors INTEGER NOT NULL DEFAULT 0,assisted INTEGER NOT NULL DEFAULT 0,available_at TEXT NOT NULL,last_mode INTEGER NOT NULL DEFAULT -1,
 done INTEGER NOT NULL DEFAULT 0,deferred INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(day,word_id));
CREATE TABLE IF NOT EXISTS learning_issues (
 id TEXT PRIMARY KEY,day TEXT NOT NULL,word_id INTEGER NOT NULL REFERENCES words(id),mode TEXT NOT NULL,options_json TEXT NOT NULL,
 issued_at TEXT NOT NULL,assisted INTEGER NOT NULL DEFAULT 0,answered_at TEXT,answer_id TEXT UNIQUE,result_json TEXT);
CREATE INDEX IF NOT EXISTS idx_learning_due ON learning_words(due);
CREATE INDEX IF NOT EXISTS idx_learning_word_answers ON learning_issues(word_id,day,issued_at);
CREATE INDEX IF NOT EXISTS idx_learning_open ON learning_issues(day,answered_at);
`);
 const columns=db.prepare('PRAGMA table_info(learning_days)').all() as {name:string}[];
 if(!columns.some(c=>c.name==='policy_version'))db.exec('ALTER TABLE learning_days ADD COLUMN policy_version INTEGER NOT NULL DEFAULT 1');
}
