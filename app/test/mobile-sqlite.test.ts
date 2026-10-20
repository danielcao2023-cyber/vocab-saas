import { afterEach, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { openDb } from '../server/src/db.ts';
import { words } from './v3-helpers.ts';
import { answerLearning, learningBooks, learningToday, nextLearning, startLearning } from '../server/src/learning/engine.ts';
import { asSharedDb, openBrowserDatabase, type BrowserDatabase } from '../web/src/offline/sqlite.ts';

const require = createRequire(import.meta.url);
const locateFile = (file: string) => require.resolve(`sql.js/dist/${file}`);
const opened: BrowserDatabase[] = [];
afterEach(() => { for (const db of opened.splice(0)) db.close(); });
async function fixture(n = 50) {
  const source = openDb(':memory:');
  words(source, n);
  const bytes = source.serialize(); source.close(); bytes[18] = 1; bytes[19] = 1;
  const db = await openBrowserDatabase(bytes, { locateFile }); opened.push(db); return db;
}

it('binds named objects, prefixed names and positional arrays and returns native mutation results', async () => {
  const db = await fixture(1);
  db.exec('CREATE TABLE sample(id INTEGER PRIMARY KEY, name TEXT, amount INTEGER)');
  const put = db.prepare('INSERT INTO sample(name,amount) VALUES (@name,@amount)');
  expect(put.run({ name: 'apple', amount: 3 })).toMatchObject({ changes: 1, lastInsertRowid: 1 });
  put.run({ '@name': 'pear', '@amount': 4 });
  expect(db.prepare('SELECT name FROM sample WHERE amount=?').get([3])).toEqual({ name: 'apple' });
  expect(db.prepare('SELECT name FROM sample WHERE amount>=? ORDER BY id').all(3)).toEqual([{ name: 'apple' }, { name: 'pear' }]);
  expect(db.prepare('SELECT name FROM sample WHERE id=?').get(999)).toBeUndefined();
  expect(db.prepare('UPDATE sample SET amount=? WHERE id=?').run(7, 999).changes).toBe(0);
  expect(db.pragma('integrity_check', { simple: true })).toBe('ok');
});

it('rolls back nested savepoints independently and rolls back all writes on an outer failure', async () => {
  const db = await fixture(1);
  db.exec('CREATE TABLE sample(n INTEGER)');
  const add = db.prepare('INSERT INTO sample VALUES (?)');
  const inner = db.transaction(() => { add.run(2); throw new Error('inner failure'); });
  const outer = db.transaction((value: number) => { add.run(value); expect(inner).toThrow('inner failure'); add.run(3); return 'committed'; });
  expect(outer(1)).toBe('committed');
  expect(db.prepare('SELECT n FROM sample').all()).toEqual([{ n: 1 }, { n: 3 }]);
  expect(db.transaction(() => { outer(4); throw new Error('outer failure'); })).toThrow('outer failure');
  expect(db.prepare('SELECT n FROM sample').all()).toEqual([{ n: 1 }, { n: 3 }]);
  expect(db.transaction(() => Promise.resolve())).toThrow(/synchronous/i);
});

it('executes real learning SQL with JSON, named upserts and nested FSRS transactions, then resumes from export', async () => {
  let db = await fixture(); let shared = asSharedDb(db);
  const now = new Date('2026-10-20T09:00:00+08:00');
  expect(learningToday(shared, now)).toMatchObject({ total: 40, started: false, answers: 0 });
  startLearning(shared, now); startLearning(shared, now);
  expect(db.prepare('SELECT COUNT(*) n FROM learning_day_words').get()).toEqual({ n: 40 });
  const modes = new Set<string>();
  let issue = ''; let result: unknown;
  for (let i = 0; i < 40; i++) {
    const turn = nextLearning(shared, now); expect(turn.kind).toBe('card');
    const card = turn.card!; modes.add(card.mode);
    const headword = (db.prepare('SELECT headword FROM words WHERE id=?').get(card.wordId) as { headword: string }).headword;
    const input = { issueId: card.issueId, answerId: `mobile-${i}`, ...(card.mode === 'recognize' ? { choiceId: card.wordId } : { answer: headword }) };
    const answered = answerLearning(shared, input, now);
    expect(answerLearning(shared, input, now)).toEqual(answered);
    if (i === 0) { issue = card.issueId; result = answered; }
  }
  expect([...modes].sort()).toEqual(['dictation', 'recognize', 'spell']);
  expect(learningToday(shared, now)).toMatchObject({ completed: 40, answers: 40 });
  expect(learningBooks(shared, 'familiar').total).toBe(40);
  expect(db.prepare('SELECT COUNT(*) n FROM review_logs').get()).toEqual({ n: 40 });
  const bytes = db.export(); db.close(); opened.splice(opened.indexOf(db), 1);
  db = await openBrowserDatabase(bytes, { locateFile }); opened.push(db); shared = asSharedDb(db);
  expect(learningToday(shared, now)).toMatchObject({ completed: 40, answers: 40 });
  expect(answerLearning(shared, { issueId: issue, answerId: 'mobile-0' }, now)).toEqual(result);
  expect(nextLearning(shared, now).kind).toBe('done');
  expect(learningToday(shared, new Date('2026-10-21T09:00:00+08:00')).reviewWords).toBe(40);
});

it('preserves foreign-key constraints after exporting and rejects damaged database bytes', async () => {
  const db = await fixture(1); db.export();
  expect(() => db.prepare('INSERT INTO word_forms(word_id,form,kind) VALUES (?,?,?)').run(999, 'bad', 'test')).toThrow(/FOREIGN KEY/);
  await expect(openBrowserDatabase(new Uint8Array([1, 2, 3, 4]), { locateFile })).rejects.toThrow();
  await expect(openBrowserDatabase(new Uint8Array(), { locateFile })).rejects.toThrow();
});


it('retains daily failures across a restart and recovers with the shared cross-day book rules', async () => {
  let db = await fixture(1); let shared = asSharedDb(db);
  let now = new Date('2026-10-20T09:00:00+08:00');
  startLearning(shared, now);
  function answer(correct: boolean, id: string) {
    const card = nextLearning(shared, now).card!;
    return answerLearning(shared, { issueId: card.issueId, answerId: id, ...(card.mode === 'recognize' ? { choiceId: correct ? card.wordId : 0 } : { answer: correct ? 'word1' : 'incorrect' }) }, now);
  }
  answer(false, 'failed');
  expect(learningBooks(shared, 'unfamiliar').total).toBe(1);
  const bytes = db.export(); db.close(); opened.splice(opened.indexOf(db), 1);
  db = await openBrowserDatabase(bytes, { locateFile }); opened.push(db); shared = asSharedDb(db);
  answer(true, 'corrected');
  expect(learningBooks(shared, 'familiar').total).toBe(1);
  expect(db.prepare('SELECT day_errors FROM learning_words').get()).toEqual({ day_errors: 1 });
  for (let day = 21; day <= 23; day++) {
    now = new Date(`2026-10-${day}T09:00:00+08:00`); startLearning(shared, now); answer(true, `day-${day}`);
  }
  expect(learningBooks(shared, 'mastered').total).toBe(1);
  now = new Date('2026-10-24T09:00:00+08:00'); startLearning(shared, now);
  answer(false, 'downgrade-one'); expect(learningBooks(shared, 'familiar').total).toBe(1);
  answer(false, 'downgrade-two'); expect(learningBooks(shared, 'unfamiliar').total).toBe(1);
});
