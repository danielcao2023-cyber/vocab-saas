import { afterEach, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDb } from '../server/src/db.ts';
import { words } from './v3-helpers.ts';
import { answerLearning, learningToday, nextLearning, startLearning } from '../server/src/learning/engine.ts';
import { createMobileSeed } from '../scripts/mobile-seed.ts';

const dirs: string[] = [];
afterEach(() => { dirs.splice(0).forEach(dir => fs.rmSync(dir, { recursive: true, force: true })); });
function fixture(n = 1600) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-seed-')); dirs.push(dir);
  const sourcePath = path.join(dir, 'source.db'), outputPath = path.join(dir, 'seed.db');
  const db = openDb(sourcePath); db.transaction(() => words(db, n))();
  return { dir, db, sourcePath, outputPath };
}

it('creates a fresh core and expansion seed from public projections without learner data, keys or cached conversations', () => {
  const { db, sourcePath, outputPath } = fixture();
  db.prepare("INSERT INTO words(headword,source,is_sample) VALUES ('sample-only','sample',1)").run();
  db.prepare("UPDATE words SET entry_raw='private-marker-entry' WHERE id=1").run();
  db.prepare("INSERT INTO settings(key,value) VALUES ('openai_key','private-marker-key')").run();
  db.prepare("UPDATE settings SET value='9999' WHERE key='new_per_day'").run();
  db.prepare("INSERT INTO ai_cache VALUES ('private-marker-hash',1,'private-marker-question','private-marker-answer','2026-10-20')").run();
  db.prepare("INSERT INTO ai_jobs(kind,error) VALUES ('chat','private-marker-job')").run();
  db.prepare("INSERT INTO content_feedback(word_id,reason) VALUES (1,'private-marker-feedback')").run();
  db.prepare("INSERT INTO word_content(word_id,kind,body_json,status,reviewed) VALUES (1,'example','private-marker-content','approved',1)").run();
  db.prepare("INSERT INTO word_forms VALUES (1,'word-form','plural')").run();
  db.prepare("INSERT INTO word_forms VALUES (1601,'sample-form','plural')").run();
  db.prepare("INSERT INTO word_freq VALUES (1,'zk_high',1,2.5,'public-basis','public-source',0,1,'2026-10-20')").run();
  const now = new Date('2026-10-20T09:00:00+08:00'); startLearning(db, now);
  const card = nextLearning(db, now).card!;
  answerLearning(db, { issueId: card.issueId, answerId: 'private-marker-answer-id', ...(card.mode === 'recognize' ? { choiceId: 0 } : { answer: 'incorrect' }) }, now);
  db.close();
  const before = fs.readFileSync(sourcePath);
  const built=createMobileSeed(sourcePath, outputPath);
  expect(fs.readFileSync(sourcePath)).toEqual(before);
  expect(fs.readFileSync(outputPath).includes(Buffer.from('private-marker'))).toBe(false);
  const seed = new Database(outputPath, { readonly: true });
  try {
    expect(seed.pragma('integrity_check', { simple: true })).toBe('ok');
    expect(seed.pragma('foreign_key_check')).toEqual([]);
    expect(seed.prepare('SELECT COUNT(*) n FROM words').get()).toEqual({ n: built.words });
    expect(seed.prepare("SELECT COUNT(*) n FROM words WHERE source='kb2022'").get()).toEqual({n:1600});
    expect(seed.prepare('SELECT COUNT(*) n FROM vocabulary_books').get()).toEqual({n:13});
    expect(seed.prepare('SELECT COUNT(*) n FROM vocabulary_units').get()).toEqual({n:36});
    expect(seed.prepare('SELECT entry_raw FROM words WHERE id=1').get()).toEqual({ entry_raw: null });
    expect(seed.prepare('SELECT * FROM word_forms').all()).toEqual([{ word_id: 1, form: 'word-form', kind: 'plural' }]);
    expect(seed.prepare('SELECT job_id,rank FROM word_freq').get()).toEqual({ job_id: null, rank: 1 });
    const allowed = new Set(['words', 'word_forms', 'word_freq', 'settings','vocabulary_books','vocabulary_units','vocabulary_members','vocabulary_entry_map','vocabulary_meta']);
    for (const { name } of seed.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[]) {
      if (!allowed.has(name)) expect(seed.prepare(`SELECT COUNT(*) n FROM "${name}"`).get(), name).toEqual({ n: 0 });
    }
    expect(seed.prepare("SELECT COUNT(*) n FROM settings WHERE key LIKE 'ai_%' OR key LIKE '%key%'").get()).toEqual({ n: 0 });
    expect(seed.prepare("SELECT value FROM settings WHERE key='new_per_day'").get()).toEqual({ value: '10' });
    expect(learningToday(seed, now)).toMatchObject({ total: 40, started: false, answers: 0, books: { new: 1600, familiar: 0, unfamiliar: 0, mastered: 0 } });
  } finally { seed.close(); }
});

it('refuses an incomplete library and never overwrites the source or an existing output', () => {
  const { db, sourcePath, outputPath } = fixture(1); db.close();
  const before = fs.readFileSync(sourcePath);
  expect(() => createMobileSeed(sourcePath, sourcePath)).toThrow();
  expect(() => createMobileSeed(sourcePath, outputPath)).toThrow(/1600/);
  expect(fs.existsSync(outputPath)).toBe(false);
  fs.writeFileSync(outputPath, 'existing');
  expect(() => createMobileSeed(sourcePath, outputPath)).toThrow(/exists|存在/);
  expect(fs.readFileSync(outputPath, 'utf8')).toBe('existing');
  expect(fs.readFileSync(sourcePath)).toEqual(before);
});
