/**
 * 仅开发/验收用：在独立测试库里造出“现在就到期”的认词、拼写、听写卡。
 * 用法：npm run seed:due -- --db data/qa.db [--list data/wordlists/sample.csv] [--n 8]
 * 会清空该测试库里的 cards / review_logs / wrong_words 后重建；拒绝对 data/vocab.db 执行。
 */
import path from 'node:path';
import { openDb } from '../server/src/db.ts';
import { loadDict, lookupKey, readList, upsertWords } from '../server/src/import.ts';
import { State } from 'ts-fsrs';

const a = process.argv.slice(2); const arg = (k: string, d?: string) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const dbPath = arg('--db');
if (!dbPath) { console.error('需要 --db <测试库路径>，例如 data/qa.db'); process.exit(2); }
if (path.resolve(dbPath) === path.resolve('data/vocab.db') || path.basename(dbPath) === 'vocab.db') { console.error('拒绝：不能对正式库 vocab.db 造数据'); process.exit(2); }
const n = Number(arg('--n', '8'));
const db = openDb(dbPath);
const list = readList(arg('--list', 'data/wordlists/sample.csv')!);
const dict = await loadDict(arg('--ecdict', 'data/raw/ecdict.csv')!, new Set(list.map((e) => lookupKey(e.headword))));
upsertWords(db, list, dict, 'sample', true);

const now = Date.now();
const iso = (ms: number) => new Date(ms).toISOString();
db.transaction(() => {
  db.exec('DELETE FROM review_logs; DELETE FROM wrong_words; DELETE FROM cards;');
  const words = db.prepare('SELECT id FROM words ORDER BY id LIMIT ?').all(n) as { id: number }[];
  const ins = db.prepare(`INSERT INTO cards(word_id,mode,due,stability,difficulty,elapsed_days,scheduled_days,learning_steps,reps,lapses,state,last_review)
    VALUES (?,?,?,?,5,1,1,0,?,0,?,?)`);
  words.forEach((w, i) => {
    const yesterday = iso(now - 86400_000);
    // 认词卡：昨天学过，前一半现在到期，后一半明天到期
    ins.run(w.id, 'recognize', i < n / 2 ? iso(now - 3600_000) : iso(now + 86400_000), 1.5, 1, State.Review, yesterday);
    ins.run(w.id, 'spell', iso(now - 3600_000), 0.5, 0, State.New, null);
    ins.run(w.id, 'dictation', iso(now - 3600_000), 0.5, 0, State.New, null);
  });
})();
const c = db.prepare(`SELECT mode, COUNT(*) n FROM cards WHERE due <= ? GROUP BY mode`).all(iso(now));
console.log(JSON.stringify({ db: dbPath, words: (db.prepare('SELECT COUNT(*) n FROM words').get() as any).n, dueNow: c }, null, 2));
db.close();
