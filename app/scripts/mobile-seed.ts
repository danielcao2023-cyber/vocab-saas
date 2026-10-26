import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import Database from 'better-sqlite3';
import { openDb } from '../server/src/db.ts';
import {installBundledVocabulary} from '../server/src/vocabulary-file.ts';
import { readSnapshot, resolved, protectTarget } from '../server/src/guard.ts';

const WORD_COLUMNS = ['id', 'headword', 'phonetic', 'pos', 'meaning_zh', 'meaning_raw', 'meaning_flag', 'meaning_source', 'ecdict_key', 'priority', 'source', 'level', 'unit', 'freq_rank', 'is_sample'] as const;
const FORM_COLUMNS = ['word_id', 'form', 'kind'] as const;
const FREQ_COLUMNS = ['word_id', 'grp', 'rank', 'score', 'basis', 'source', 'is_inferred', 'created_at'] as const;
const PUBLIC_TABLES = new Set(['words', 'word_forms', 'word_freq','vocabulary_books','vocabulary_units','vocabulary_members','vocabulary_entry_map','vocabulary_meta']);
const DEFAULT_SETTINGS = new Map([
  ['new_per_day', '10'], ['review_limit', '200'], ['level2_every', '5'], ['choice_enabled', '1'], ['choice_weights', '1,1,1'],
  ['makeup_per_month', '2'], ['makeup_window_days', '7'], ['makeup_requires_today', '1'], ['duration_cap_ms', '300000'],
]);

/** Creates a new public vocabulary image. The source is only read, including active WAL data. */
export function createMobileSeed(sourcePath: string, outputPath: string) {
  const sourceFile = resolved(sourcePath), outputFile = resolved(outputPath);
  if (sourceFile === outputFile) throw new Error('Mobile seed output must differ from its source');
  protectTarget(outputFile);
  if (fs.existsSync(outputFile)) throw new Error(`Mobile seed output already exists: ${outputFile}`);
  const snapshot = Buffer.from(readSnapshot(sourceFile));
  if (snapshot.length >= 100) { snapshot[18] = 1; snapshot[19] = 1; }
  const source = new Database(snapshot);
  const target = openDb(':memory:');
  try {
    const words = source.prepare(`SELECT ${WORD_COLUMNS.join(',')} FROM words WHERE source='kb2022' AND is_sample=0 ORDER BY id`).all() as Record<string, unknown>[];
    if (words.length !== 1600) throw new Error(`Mobile seed requires exactly 1600 kb2022 words; got ${words.length}`);
    target.transaction(() => {
      const insert = target.prepare(`INSERT INTO words (${WORD_COLUMNS.join(',')}) VALUES (${WORD_COLUMNS.map(() => '?').join(',')})`);
      for (const row of words) insert.run(...WORD_COLUMNS.map(column => row[column]));
      for (const [table, columns] of [['word_forms', FORM_COLUMNS], ['word_freq', FREQ_COLUMNS]] as const) {
        const rows = source.prepare(`SELECT ${columns.map(column => `p.${column}`).join(',')} FROM ${table} p JOIN words w ON w.id=p.word_id WHERE w.source='kb2022' AND w.is_sample=0`).all() as Record<string, unknown>[];
        const put = target.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`);
        for (const row of rows) put.run(...columns.map(column => row[column]));
      }
      // Do not inherit source settings; model choices and credentials are empty on first launch.
      target.exec('DELETE FROM settings');
      const putSetting = target.prepare('INSERT INTO settings(key,value) VALUES (?,?)');
      for (const [key, val] of DEFAULT_SETTINGS) putSetting.run(key, val);
      installBundledVocabulary(target);
    })();
    for (const { name } of target.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[]) {
      if (PUBLIC_TABLES.has(name) || name === 'settings') continue;
      const count = target.prepare(`SELECT COUNT(*) n FROM "${name.replaceAll('"', '""')}"`).get() as { n: number };
      if (count.n !== 0) throw new Error(`Mobile seed must not contain personal state: ${name}`);
    }
    if (target.pragma('integrity_check', { simple: true }) !== 'ok' || (target.pragma('foreign_key_check') as unknown[]).length !== 0) throw new Error('Mobile seed database integrity check failed');
    target.pragma('journal_mode=DELETE');
    const bytes = target.serialize(); bytes[18] = 1; bytes[19] = 1;
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, bytes, { flag: 'wx', mode: 0o600 });
    return { words:(target.prepare('SELECT COUNT(*) n FROM words').get() as {n:number}).n,coreWords:words.length,bytes: bytes.length, outputPath: outputFile };
  } finally { source.close(); target.close(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [source, output] = process.argv.slice(2);
  if (!source || !output) throw new Error('Usage: tsx scripts/mobile-seed.ts <source.db> <new-output.db>');
  console.log(JSON.stringify(createMobileSeed(source, output)));
}
