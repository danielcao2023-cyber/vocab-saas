// fix1：全库 1600 词 × 2 题型，统计出不了题的数量、遮挡后仍露出答案的数量、Ms 干扰项
import Database from 'better-sqlite3';
import { buildQuestion } from '/workspace/vocab-saas/wt-v3/server/src/quiz.ts';
import { answerForms } from '/workspace/vocab-saas/wt-v3/server/src/text.ts';
const db = new Database(process.argv[2], { readonly: true }) as any;
const words = db.prepare("SELECT id,headword FROM words WHERE trim(COALESCE(meaning_zh,''))<>''").all();
let nulls: string[] = [], leaks: string[] = []; let n = 0; const ms: string[] = [];
let seed = 1; const rng = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
for (const w of words) for (const qt of ['meaning_choice', 'listen_choice'] as const) {
  const q = buildQuestion(db, { id: 0, word_id: w.id, mode: 'recognize', state: 2 }, qt, rng); n++;
  if (!q) { nulls.push(`${w.headword}/${qt}`); continue; }
  const texts = qt === 'meaning_choice' ? [q.prompt!] : [q.options.find(o => o.wordId === w.id)!.text];
  for (const t of texts) for (const f of answerForms(w.headword)) if (new RegExp(`(^|[^A-Za-z])${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z])`, 'i').test(t)) leaks.push(`${w.headword}: ${t}`);
  if (w.headword.startsWith('Ms ')) ms.push(qt + ': ' + q.options.map(o => db.prepare('SELECT headword FROM words WHERE id=?').get(o.wordId).headword).join(' | '));
  if (w.headword === 'lost' && qt === 'meaning_choice') ms.push('lost prompt: ' + JSON.stringify(q.prompt));
}
console.log(JSON.stringify({ total: n, nulls: nulls.length, nullList: nulls, leaks, samples: ms }, null, 1));
