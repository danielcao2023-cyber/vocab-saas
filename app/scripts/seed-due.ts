/**
 * 仅开发/验收用：在独立测试库里造出“现在就到期”的认词、拼写、听写卡。
 * 用法：npm run seed:due -- --db data/qa.db [--list data/wordlists/sample.csv] [--n 8]
 * 会清空该测试库里的 cards / review_logs / wrong_words 后重建；拒绝对 data/vocab.db 执行。
 */
import path from 'node:path';
import { openDb } from '../server/src/db.ts';
import { filterSenses, loadDict, lookupKey, readList, upsertWords } from '../server/src/import.ts';
import { acceptedSpellings } from '../server/src/study.ts';
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
// 仅测试库：一个专门的测试词，用来让验收看到“释义待人工看”（原始释义全被过滤掉）
const QA_RAW = '[医] 验收测试用义项（不是真实词）\\n[计] 验收测试用义项二';
const qf = filterSenses(QA_RAW);
db.prepare(`INSERT INTO words(headword,phonetic,meaning_zh,meaning_raw,meaning_flag,source,level,is_sample) VALUES ('qatest',NULL,?,?,?,'qa-only-test','仅测试库',1)
  ON CONFLICT(source,headword) DO UPDATE SET meaning_zh=excluded.meaning_zh,meaning_raw=excluded.meaning_raw,meaning_flag=excluded.meaning_flag`).run(qf.senses.join('\n'), QA_RAW, qf.flag);

const report: Record<string, unknown> = {};
db.transaction(() => {
  db.exec('DELETE FROM review_logs; DELETE FROM wrong_words; DELETE FROM cards;');
  const ins = db.prepare(`INSERT INTO cards(word_id,mode,due,stability,difficulty,elapsed_days,scheduled_days,learning_steps,reps,lapses,state,last_review)
    VALUES (?,?,?,?,5,1,1,0,?,0,?,?)`);
  const yesterday = iso(now - 86400_000); const dueNow = iso(now - 3600_000); const tomorrow = iso(now + 86400_000);
  const id = (hw: string, src = 'sample') => (db.prepare('SELECT id FROM words WHERE headword=? AND source=?').get(hw, src) as { id: number }).id;
  const words = db.prepare("SELECT id, headword FROM words WHERE source='sample' ORDER BY id LIMIT ?").all(n) as { id: number; headword: string }[];
  const recogDue = new Set<number>(words.slice(0, Math.floor(n / 2)).map((w) => w.id));
  // 认词卡：>2 条释义的 act(3)、enough(4)，以及“释义待人工看”的测试词，必定现在到期
  for (const hw of ['act', 'enough']) recogDue.add(id(hw));
  recogDue.add(id('qatest', 'qa-only-test'));
  const recogIds = new Set<number>([...words.map((w) => w.id), ...recogDue]);
  for (const wid of recogIds) ins.run(wid, 'recognize', recogDue.has(wid) ? dueNow : tomorrow, 1.5, 1, State.Review, yesterday);
  for (const w of words) { ins.run(w.id, 'spell', dueNow, 0.5, 0, State.New, null); ins.run(w.id, 'dictation', dueNow, 0.5, 0, State.New, null); }
  const q = (hw: string) => db.prepare('SELECT w.headword, w.meaning_zh, w.meaning_flag FROM words w WHERE w.id=?').get(id(hw, hw === 'qatest' ? 'qa-only-test' : 'sample')) as any;
  report.recognitionChecks = ['act', 'enough', 'qatest'].map((hw) => { const r = q(hw); return { headword: r.headword, senses: r.meaning_zh.split('\n').length, flag: r.meaning_flag }; });
  report.spellingAnswers = words.map((w) => ({ headword: w.headword, accepted: acceptedSpellings(w.headword) }));
})();
const c = db.prepare(`SELECT mode, COUNT(*) n FROM cards WHERE due <= ? GROUP BY mode`).all(iso(now));
console.log(JSON.stringify({ db: dbPath, words: (db.prepare('SELECT COUNT(*) n FROM words').get() as any).n, dueNow: c, ...report }, null, 2));
db.close();
