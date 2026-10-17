import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { openDb } from '../server/src/db.ts';
import * as importer from '../server/src/import.ts';
import { nextCard, progress, review } from '../server/src/study.ts';
import { Rating } from 'ts-fsrs';
import { splitSenses } from '../web/src/senses.ts';

const tmp = fs.mkdtempSync(path.resolve('test/.curriculum-'));
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));
const file = (name: string, contents: string) => { const p = path.join(tmp, name); fs.writeFileSync(p, contents); return p; };
const header = 'page\tentry\tlevel2_star\tflag\tnote\n';
const curriculum = file('curriculum.tsv', header + '1\tMiss\t0\t0\t\n1\tmiss\t0\t0\t\n1\tMs (AmE Ms.)\t1\t0\t\n1\to’clock\t0\t0\t\n');
const level2 = file('level2.tsv', header + '1\tMs (AmE Ms.)\t1\t0\t\n');
const manual = file('manual.tsv', 'entry\tmanual_meaning\nMs (AmE Ms.)\tn. 女士\\n称呼\n');
const dictFile = file('dict.csv', [
  'word,phonetic,definition,translation,pos,collins,oxford,tag,bnc,frq,exchange,detail,audio',
  'MISS,upper,,n. 大写,n,,,,9,8,,,',
  'miss,mis,,v. 想念,v,,,,7,0,,,',
  'MS,,,"[计] 微软",n,,,,0,0,,,',
  'Ms.,,,n. 女士,n,,,,0,0,,,',
  "o'clock,,,adv. 点钟,adv,,,,0,4064,,,",
  'mixed,,,"n. 第一行',
  '第二行",n,,,,0,3,,,',
  'CAP,,,n. 第一条,n,,,,0,1,,,',
  'Cap,,,n. 第二条,n,,,,0,2,,,',
  'May,,,n. 五月,n,,,,0,10,,,',
  'may,,,v. 可以,v,,,,0,11,,,',
].join('\n'));
const expected = { total: 4, level2: 1, level3: 3 };
let dict: Awaited<ReturnType<typeof importer.loadDict>>;
beforeAll(async () => { dict = await importer.loadDict(dictFile, new Set(['Miss', 'Ms', 'Ms.', "o'clock", 'mixed', 'cap', 'may'])); });
const cli = (args: string[]) => spawnSync(process.execPath, ['--import', 'tsx', 'server/src/import.ts', ...args], { encoding: 'utf8' });
const cliArgs = ['--curriculum', curriculum, '--level2', level2, '--manual', manual, '--ecdict', dictFile, '--source', 'kb2022'];

function seedRelated(db: ReturnType<typeof openDb>, id: number) {
  const now = new Date('2026-10-17T01:00:00Z');
  const card = nextCard(db, now, 'new')!;
  expect(card.word_id).toBe(id);
  review(db, card.id as number, Rating.Again, now);
  db.prepare("INSERT INTO word_content(word_id,kind,body_json) VALUES (?,'example','{}')").run(id);
  db.prepare("INSERT INTO content_feedback(word_id,reason) VALUES (?,'test')").run(id);
  db.prepare("INSERT INTO ai_cache(key_hash,word_id) VALUES (?,?)").run('cache-' + id, id);
}

describe('curriculum validation and ECDICT keys', () => {
  it('retains case, raw entry, quote normalization, levels and priority', () => {
    const list = importer.readCurriculum(curriculum, level2);
    expect(list).toEqual([
      { headword: 'Miss', entry_raw: 'Miss', level: '三级', priority: 2, pos: null },
      { headword: 'miss', entry_raw: 'miss', level: '三级', priority: 2, pos: null },
      { headword: 'Ms (AmE Ms.)', entry_raw: 'Ms (AmE Ms.)', level: '二级', priority: 1, pos: null },
      { headword: "o'clock", entry_raw: 'o’clock', level: '三级', priority: 2, pos: null },
    ]);
    const csv = file('quotes.csv', 'headword,level\nMiss,三级\nmiss,三级\no’clock,三级\no\'clock,三级\n');
    expect(importer.readList(csv).map((x) => x.headword)).toEqual(['Miss', 'miss', "o'clock"]);
  });
  it('uses exact keys first, lowercase variant next, otherwise first file entry', () => {
    expect([...dict.keys()]).toEqual(['MISS', 'miss', 'MS', 'Ms.', "o'clock", 'mixed', 'CAP', 'Cap', 'May', 'may']);
    for (const [input, key] of [['MISS', 'MISS'], ['Miss', 'miss'], ['Ms', 'MS'], ['Ms.', 'Ms.'], ['cap', 'CAP'], ['MAY', 'may'], ['May', 'May'], ['unknown', null]]) {
      expect(importer.resolveEcdictKey(input!, dict)).toBe(key);
    }
    expect(importer.lookupKey('Internet (AmE internet)')).toBe('Internet');
    expect(importer.lookupKey('a / an')).toBe('a');
    expect(importer.lookupKey('o’clock')).toBe("o'clock");
    expect(dict.get('mixed')?.translation).toBe('n. 第一行\n第二行');
  });
  it('rejects curriculum duplicates after normalizing quotes', () => {
    const duplicate = file('duplicate.tsv', header + "1\to’clock\t0\t0\t\n2\to'clock\t0\t0\t\n");
    expect(() => importer.readCurriculum(duplicate)).toThrow(/重复.*3|3.*重复/);
  });
  it('reports both missing and unexpected level2 entries', () => {
    const bad = file('bad-level2.tsv', header + '1\tother\t1\t0\t\n');
    expect(() => importer.readCurriculum(curriculum, bad)).toThrow(/Ms.*other|other.*Ms/s);
  });
  it('reports every invalid manual line, including duplicate and empty meaning', () => {
    const bad = file('bad-manual.tsv', "entry\tmanual_meaning\nunknown\t未知\nMiss\t女士\nMiss\t重复\nmiss\t   \n");
    expect(() => importer.readManualMeanings(bad, importer.readCurriculum(curriculum))).toThrow(/2.*unknown[\s\S]*4.*重复[\s\S]*5.*空/);
    const quotes = file('quotes-manual.tsv', "entry\tmanual_meaning\no'clock\tadv. 点钟\n");
    expect(importer.readManualMeanings(quotes, importer.readCurriculum(curriculum)).get("o'clock")).toBe('adv. 点钟');
    const duplicate = file('quotes-duplicate.tsv', "entry\tmanual_meaning\no’clock\t点钟\no'clock\t点钟\n");
    expect(() => importer.readManualMeanings(duplicate, importer.readCurriculum(curriculum))).toThrow(/重复/);
  });
  it('CLI exits 1 before opening/migrating a DB for invalid inputs', () => {
    const dbFile = path.join(tmp, 'unchanged.db');
    const raw = new Database(dbFile); raw.exec('CREATE TABLE marker(value TEXT); INSERT INTO marker VALUES (\'original\')'); raw.close();
    const before = fs.readFileSync(dbFile);
    const invalid = file('unknown.tsv', 'entry\tmanual_meaning\nunknown\t未知\n');
    const r = cli([...cliArgs, '--manual', invalid, '--db', dbFile]);
    expect(r.status).toBe(1); expect(r.stderr).toContain('unknown');
    expect(fs.readFileSync(dbFile)).toEqual(before);
    const absent = path.join(tmp, 'validation-absent.db');
    const r2 = cli([...cliArgs, '--level2', file('empty-level2.tsv', header), '--db', absent]);
    expect(r2.status).toBe(1); expect(fs.existsSync(absent)).toBe(false);
  });
});

describe('atomic curriculum imports', () => {
  it('applies manual meanings and frequency fallback, preserving all study data on reimport', () => {
    const db = openDb(':memory:');
    try {
      const list = importer.readCurriculum(curriculum, level2);
      const meanings = importer.readManualMeanings(manual, list);
      const options = { expected, manual: meanings };
      const first = importer.upsertCurriculum(db, list, dict, 'kb2022', options);
      expect(first).toMatchObject({ inserted: 4, updated: 0, unchanged: 0, total: 4, 二级: 1, 三级: 3, manualApplied: 1, flagged: 0, missingPhonetic: 2, staleRows: [] });
      expect(first.caseInsensitiveHits).toEqual([{ headword: 'Miss', ecdict_key: 'miss' }, { headword: 'Ms (AmE Ms.)', ecdict_key: 'MS' }]);
      const ms = db.prepare("SELECT * FROM words WHERE headword='Ms (AmE Ms.)'").get() as any;
      expect(ms).toMatchObject({ meaning_zh: 'n. 女士\n称呼', meaning_raw: '[计] 微软', meaning_flag: null, meaning_source: 'manual', ecdict_key: 'MS', priority: 1, freq_rank: null });
      expect(splitSenses(ms.meaning_zh)).toEqual({ shown: ['n. 女士', '称呼'], more: [] });
      expect(db.prepare("SELECT freq_rank,meaning_source FROM words WHERE headword='miss'").get()).toEqual({ freq_rank: 7, meaning_source: 'ecdict' });
      expect(db.prepare("SELECT entry_raw,freq_rank FROM words WHERE headword=?").get("o'clock")).toEqual({ entry_raw: 'o’clock', freq_rank: 4064 });
      const miss = db.prepare("SELECT id FROM words WHERE headword='Miss'").get() as { id: number };
      seedRelated(db, miss.id);
      const snapshot = () => ['words', 'cards', 'review_logs', 'wrong_words', 'word_content', 'content_feedback', 'ai_cache'].map((t) => db.prepare(`SELECT * FROM ${t}`).all());
      const before = snapshot();
      expect(importer.upsertCurriculum(db, list, dict, 'kb2022', options)).toMatchObject({ inserted: 0, updated: 0, unchanged: 4 });
      expect(snapshot()).toEqual(before);
      const changed = new Map(meanings); changed.set('miss', 'v. 思念');
      expect(importer.upsertCurriculum(db, list, dict, 'kb2022', { expected, manual: changed })).toMatchObject({ inserted: 0, updated: 1, unchanged: 3 });
      expect(snapshot().slice(1)).toEqual(before.slice(1));
      expect(nextCard(db)?.meaning_source).toBe('ecdict');
    } finally { db.close(); }
  });
  it('clears samples and all related tables but preserves curriculum rows and progress', () => {
    const db = openDb(':memory:');
    try {
      const sampleId = Number(db.prepare("INSERT INTO words(headword,source,is_sample) VALUES ('sample','sample',1)").run().lastInsertRowid);
      seedRelated(db, sampleId);
      const list = importer.readCurriculum(curriculum);
      importer.upsertCurriculum(db, list, dict, 'kb2022', { expected });
      const c = nextCard(db, new Date('2026-10-17T01:00:00Z'), 'new')!;
      review(db, c.id as number, Rating.Again, new Date('2026-10-17T01:00:00Z'));
      const keptCards = db.prepare('SELECT * FROM cards WHERE word_id<>?').all(sampleId);
      const keptLogs = db.prepare('SELECT l.* FROM review_logs l JOIN cards c ON c.id=l.card_id WHERE c.word_id<>?').all(sampleId);
      const r = importer.upsertCurriculum(db, list, dict, 'kb2022', { expected, clearSample: true });
      expect(r.clearSample).toEqual({ words: 1, cards: 3, review_logs: 1, wrong_words: 1, word_content: 1, content_feedback: 1, ai_cache: 1 });
      expect(db.prepare('SELECT * FROM cards').all()).toEqual(keptCards);
      expect(db.prepare('SELECT * FROM review_logs').all()).toEqual(keptLogs);
      expect(progress(db)).toHaveLength(1); expect(progress(db)[0]).toMatchObject({ source: 'kb2022', isSample: false, total: 4 });
      const again = importer.upsertCurriculum(db, list, dict, 'kb2022', { expected, clearSample: true });
      expect(Object.values(again.clearSample)).toEqual([0, 0, 0, 0, 0, 0, 0]);
    } finally { db.close(); }
  });
  it('rolls back cleanup and upserts on count mismatch; lists stale rows without deleting', () => {
    const db = openDb(':memory:');
    try {
      db.prepare("INSERT INTO words(headword,source,is_sample) VALUES ('sample','sample',1),('old','kb2022',0)").run();
      const before = db.prepare('SELECT * FROM words').all();
      expect(() => importer.upsertCurriculum(db, importer.readCurriculum(curriculum), dict, 'kb2022', { expected, clearSample: true })).toThrow(/计数.*old/s);
      expect(db.prepare('SELECT * FROM words').all()).toEqual(before);
      const r = importer.upsertCurriculum(db, importer.readCurriculum(curriculum), dict, 'kb2022', { expected: { total: 5, level2: 1, level3: 3 } });
      expect(r.staleRows).toEqual([{ id: 2, headword: 'old', level: null }]);
    } finally { db.close(); }
  });
  it('reports missing dictionary, filtered meanings and absent phonetics', () => {
    const db = openDb(':memory:');
    try {
      const list = importer.readCurriculum(curriculum);
      const r = importer.upsertCurriculum(db, list, new Map(), 'kb2022', { expected });
      expect(r.missingEcdict).toEqual(['Miss', 'miss', 'Ms (AmE Ms.)', "o'clock"]);
      expect(r.missingPhonetic).toBe(4);
      const r2 = importer.upsertCurriculum(db, list, dict, 'kb2022', { expected });
      expect(r2.flaggedWords).toEqual(['Ms (AmE Ms.)']);
    } finally { db.close(); }
  });
});

describe('dry-run memory databases', () => {
  it('migrates/imports/clears an existing DB copy without modifying its bytes', () => {
    const p = path.join(tmp, 'dry.db');
    const legacy = new Database(p);
    legacy.exec("CREATE TABLE words(id INTEGER PRIMARY KEY,headword TEXT NOT NULL,phonetic TEXT,pos TEXT,meaning_zh TEXT,source TEXT NOT NULL,level TEXT,unit TEXT,freq_rank INTEGER,is_sample INTEGER NOT NULL DEFAULT 0,UNIQUE(source,headword)); INSERT INTO words(headword,source,is_sample) VALUES ('sample','sample',1)");
    legacy.close();
    const before = fs.readFileSync(p);
    const db = openDb(p, { dryRun: true });
    try {
      const r = importer.upsertCurriculum(db, importer.readCurriculum(curriculum), dict, 'kb2022', { expected, clearSample: true, dryRun: true });
      expect(r).toMatchObject({ total: 4, dryRun: true, clearSample: { words: 1 } });
      expect(db.prepare('PRAGMA table_info(words)').all()).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'meaning_source' })]));
    } finally { db.close(); }
    expect(fs.readFileSync(p)).toEqual(before);
    const failed = cli([...cliArgs, '--db', p, '--dry-run', '--clear-sample']); // default 1600 count mismatch
    expect(failed.status).toBe(1); expect(failed.stderr).toContain('计数');
    expect(fs.readFileSync(p)).toEqual(before);
  });
  it('dry-run works on a WAL-mode DB (like vocab.db/qa.db) and leaves its bytes unchanged', () => {
    const p = path.join(tmp, 'wal.db');
    const w = openDb(p); w.prepare("INSERT INTO words(headword,source,is_sample) VALUES ('sample','sample',1)").run(); w.close();
    expect(fs.readFileSync(p)[18]).toBe(2); // WAL 头
    const before = fs.readFileSync(p);
    const db = openDb(p, { dryRun: true });
    try {
      const r = importer.upsertCurriculum(db, importer.readCurriculum(curriculum), dict, 'kb2022', { expected, clearSample: true, dryRun: true });
      expect(r).toMatchObject({ total: 4, dryRun: true, clearSample: { words: 1 } });
    } finally { db.close(); }
    expect(fs.readFileSync(p)).toEqual(before);
  });
  it('never creates the DB when it does not exist', () => {
    const p = path.join(tmp, 'absent.db');
    const db = openDb(p, { dryRun: true });
    try { importer.upsertCurriculum(db, importer.readCurriculum(curriculum), dict, 'kb2022', { expected, dryRun: true }); }
    finally { db.close(); }
    expect(fs.existsSync(p)).toBe(false);
    const r = cli(['--list', file('old.csv', 'headword,level\nmiss,示例\n'), '--source', 'legacy', '--ecdict', dictFile, '--db', p, '--dry-run']);
    expect(r.status).toBe(0); expect(JSON.parse(r.stdout).dryRun).toBe(true);
    expect(fs.existsSync(p)).toBe(false);
  });
});
