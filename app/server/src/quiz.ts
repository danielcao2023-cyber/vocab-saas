import {displayHeadword} from './display-headword.ts';
import type { DB } from './db.ts';
import { Rating, State } from 'ts-fsrs';
import { review, type CardRow } from './study.ts';
import { shDayStart } from './time.ts';
import { settings as readSettings } from './settings.ts';
import { mainHeadwords, maskAnswer, normalizeQuotes, hasDictionaryPlaceholder } from './text.ts';
export type Qtype = 'flip' | 'listen_choice' | 'meaning_choice' | 'spell' | 'dictation';
export type Context = 'study' | 'practice';
export type Rng = () => number;
interface Word { id: number; headword: string; meaning_zh: string | null; meaning_source: string | null; phonetic: string | null; source: string; is_sample: number }
type QuizCard = Pick<CardRow, 'id' | 'word_id' | 'state' | 'mode'>;
export interface Question { id: number; qtype: 'listen_choice' | 'meaning_choice'; prompt?: string; options: { wordId: number; text: string }[] }
interface Issue { id: number; card_id: number; qtype: Question['qtype']; context: Context; options_json: string; answer_word_id: number; issued_at: string; answered_at: string | null; chosen_word_id: number | null; answer_id: string | null }
const first = (s: string | null) => (s ?? '').split('\n').map(x => x.trim()).filter(Boolean)[0] ?? '';
const norm = (s: string) => normalizeQuotes(s).toLowerCase().replace(/[\s，,；;、。.!！?？：:]/g, '');
const head = (s: string) => norm(mainHeadwords(s)[0] ?? s);
export function meaningSet(s: string | null) {
  return new Set((s ?? '').split('\n').slice(0, 2).flatMap(line => line.replace(/\([^)]*\)|（[^）]*）/g, '').replace(/^\s*(?:(?:[a-z]+\.)\s*)+/i, '').split(/[,，;；、]/)).map(norm).filter(Boolean));
}
/** 意思相近、孩子容易混的称呼/词义组：同组的词不同时出现在一道题里（如 Ms 女士 与 miss 小姐） */
const NEAR_SYNONYMS: string[][] = [
  ['女士', '小姐', '夫人', '太太', '淑女', '贵妇', '妇女', '女人'],
  ['先生', '绅士', '阁下', '男人'],
];
const groupOf = (term: string) => NEAR_SYNONYMS.findIndex(g => g.some(x => term.includes(x)));
/** 两个词的前两行义项是否重叠：相同、一方包含另一方（≥2 字），或属于同一近义组 */
export function meaningsOverlap(a: string | null, b: string | null) {
  const A = [...meaningSet(a)], B = [...meaningSet(b)];
  return A.some(x => B.some(y => x === y || (Math.min(x.length, y.length) >= 2 && (x.includes(y) || y.includes(x))) || (groupOf(x) >= 0 && groupOf(x) === groupOf(y))));
}
const pos = (s: string | null) => (first(s).match(/^([a-z]+)\./i)?.[1] ?? '').toLowerCase().replace(/^(vt|vi)$/, 'v');
export function editDistance(a: string, b: string) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + Number(a[i - 1] !== b[j - 1]));
    row = next;
  }
  return row[b.length];
}
function shuffle<T>(items: T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.min(i, Math.floor(rng() * (i + 1))); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
export function pickQtype(card: QuizCard, rng: Rng = Math.random, config: Record<string, string> = {}): Qtype {
  if (card.mode !== 'recognize') return card.mode;
  if (card.state === State.New || config.choice_enabled === '0') return 'flip';
  const weights = (config.choice_weights ?? '1,1,1').split(',').map(Number);
  if (weights.length !== 3 || weights.some(w => !Number.isFinite(w) || w < 0) || !weights.some(w => w > 0)) return 'flip';
  let r = rng() * weights.reduce((a,b) => a + b, 0);
  for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r < 0) return (['flip','listen_choice','meaning_choice'] as Qtype[])[i]; }
  return 'meaning_choice';
}
/** Select mutually distinct, non-synonymous options. No issue is written until the complete set is valid. */
export function buildQuestion(db: DB, card: QuizCard, qtype: Qtype, rng: Rng = Math.random) {
  if (qtype !== 'listen_choice' && qtype !== 'meaning_choice') return null;
  const answer = db.prepare('SELECT * FROM words WHERE id=?').get(card.word_id) as Word;
  if (!first(answer.meaning_zh)) return null;
  const display = (w: Word) => qtype === 'listen_choice' ? first(w.meaning_zh) : displayHeadword(db,w.id,w.headword);
  const a = head(answer.headword);
  const candidates = (db.prepare("SELECT * FROM words WHERE source=? AND is_sample=? AND id<>? AND trim(COALESCE(meaning_zh,''))<>''").all(answer.source, answer.is_sample, answer.id) as Word[])
    .map(w => ({ word: w, score: (pos(w.meaning_zh) === pos(answer.meaning_zh) ? 100 : 0) + 20 - editDistance(a, head(w.headword)) + (head(w.headword)[0] === a[0] ? 4 : 0) + (Math.abs(head(w.headword).length - a.length) <= 2 ? 3 : 0) }))
    .sort((a,b) => b.score - a.score || a.word.id - b.word.id);
  const chosen: Word[] = [answer];
  const valid = (w: Word) => chosen.every(other => head(other.headword) !== head(w.headword) && norm(display(other)) !== norm(display(w)) && !meaningsOverlap(w.meaning_zh, other.meaning_zh));
  // Work through score bands of about 12. Exhaust one band before relaxing the POS preference.
  for (const same of [true, false]) {
    const pool = candidates.filter(c => (pos(c.word.meaning_zh) === pos(answer.meaning_zh)) === same);
    for (let offset = 0; offset < pool.length && chosen.length < 4; offset += 12) {
      for (const c of shuffle(pool.slice(offset, offset + 12), rng)) if (chosen.length < 4 && valid(c.word)) chosen.push(c.word);
    }
  }
  if (chosen.length < 4) return null;
  return { qtype, prompt: qtype === 'meaning_choice' ? promptOf(answer) : undefined,
    options: shuffle(chosen, rng).map(w => ({ wordId: w.id, text: qtype === 'listen_choice' ? maskAnswer(display(w), answer.headword) : display(w) })) };
}
/** 看义选词题面：作答前遮住答案词头和词形原形（服务端也遮，不只靠前端） */
function promptOf(answer: Word) {
  return maskAnswer(answer.meaning_source === 'manual' ? answer.meaning_zh! : answer.meaning_zh!.split('\n').slice(0, 2).join('\n'), answer.headword);
}
function renderIssue(db: DB, issue: Issue): Question {
  const answer = db.prepare('SELECT * FROM words WHERE id=?').get(issue.answer_word_id) as Word;
  const words = (JSON.parse(issue.options_json) as number[]).map(id => db.prepare('SELECT * FROM words WHERE id=?').get(id) as Word);
  return { id: issue.id, qtype: issue.qtype, ...(issue.qtype === 'meaning_choice' ? { prompt: promptOf(answer) } : {}), options: words.map(w => ({ wordId: w.id, text: issue.qtype === 'listen_choice' ? maskAnswer(first(w.meaning_zh), answer.headword) : displayHeadword(db,w.id,w.headword) })) };
}
export function issueQuestion(db: DB, card: QuizCard, now = new Date(), context: Context = 'study', rng: Rng = Math.random, forced?: Qtype): Question | null {
  const word=db.prepare('SELECT headword FROM words WHERE id=?').get(card.word_id) as {headword:string};
  if(hasDictionaryPlaceholder(word.headword))return null;
  const existing = db.prepare(`SELECT * FROM question_issues WHERE card_id=? AND context=? AND answered_at IS NULL AND issued_at>=? AND issued_at<? ORDER BY id DESC LIMIT 1`).get(card.id, context, shDayStart(now).toISOString(), new Date(shDayStart(now).getTime() + 86400_000).toISOString()) as Issue | undefined;
  if (existing) return renderIssue(db, existing);
  // 另一个 context（学习/练错词）今天还有没答的选择题：/api/review 会拒绝翻面自评，所以这里也出同一题型的选择题，避免卡住
  const other = openQuestion(db, card.id, now);
  const config = readSettings(db);
  const qtype = other && card.mode === 'recognize' ? other.qtype
    : card.mode === 'recognize' && (card.state === State.New || config.choice_enabled === '0') ? 'flip' : forced ?? pickQtype(card, rng, config);
  const q = buildQuestion(db, card, qtype, rng); if (!q) return other ? renderIssue(db, other) : null;
  const r = db.prepare('INSERT INTO question_issues(card_id,qtype,context,options_json,answer_word_id,issued_at) VALUES (?,?,?,?,?,?)').run(card.id, q.qtype, context, JSON.stringify(q.options.map(o => o.wordId)), card.word_id, now.toISOString());
  return { ...q, id: Number(r.lastInsertRowid) };
}
function openQuestion(db: DB, cardId: number, now: Date, context?: Context) {
  return db.prepare(`SELECT * FROM question_issues WHERE card_id=? AND (? IS NULL OR context=?) AND answered_at IS NULL AND issued_at>=? AND issued_at<? ORDER BY id DESC LIMIT 1`)
    .get(cardId, context ?? null, context ?? null, shDayStart(now).toISOString(), new Date(shDayStart(now).getTime() + 86400_000).toISOString()) as Issue | undefined;
}
/** 该卡今天是否有未作答的选择题（不分 context；给了 context 只看该 context）。有就必须走 /api/answer，由服务端判对错 */
export function hasOpenQuestion(db: DB, cardId: number, context?: Context, now = new Date()) {
  const word=db.prepare('SELECT w.headword FROM cards c JOIN words w ON w.id=c.word_id WHERE c.id=?').get(cardId) as {headword:string}|undefined;
  if(word&&hasDictionaryPlaceholder(word.headword))return false;
  return !!openQuestion(db, cardId, now, context);
}
export function availableQtypes(db: DB, card: QuizCard, cards: QuizCard[]): Qtype[] {
  const types: Qtype[] = ['flip'];
  if(hasDictionaryPlaceholder((db.prepare('SELECT headword FROM words WHERE id=?').get(card.word_id) as {headword:string}).headword))return types;
  if (card.state === State.New) return types;
  const choicesEnabled = readSettings(db).choice_enabled !== '0';
  for (const type of ['listen_choice','meaning_choice'] as const) if (choicesEnabled && buildQuestion(db, card, type, () => .5)) types.push(type);
  for (const type of ['spell','dictation'] as const) if (cards.some(c => c.mode === type)) types.push(type);
  return types;
}
export class QuizError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function answerQuestion(db: DB, questionId: number, choiceWordId: number, answerId: string, now = new Date(), durationMs?: number) {
  if (typeof answerId !== 'string' || !answerId.trim()) throw new QuizError('answerId required');
  return db.transaction(() => {
    const issue = db.prepare('SELECT * FROM question_issues WHERE id=?').get(questionId) as Issue | undefined;
    if (!issue) throw new QuizError('question not found');
    const prior = db.prepare('SELECT * FROM question_issues WHERE answer_id=?').get(answerId) as Issue | undefined;
    if (prior && prior.id !== questionId) throw new QuizError('answerId already used', 409);
    if (issue.answered_at && issue.answer_id !== answerId) throw new QuizError('question already answered', 409);
    const duplicate = !!prior;
    const chosenId = duplicate ? prior.chosen_word_id! : choiceWordId;
    if (!(JSON.parse(issue.options_json) as number[]).includes(chosenId)) throw new QuizError('choice not in options');
    if (!duplicate && db.prepare('SELECT 1 FROM review_logs WHERE answer_id=?').get(answerId)) throw new QuizError('answerId already used', 409);
    const expected = db.prepare('SELECT headword,phonetic,meaning_zh,meaning_source FROM words WHERE id=?').get(issue.answer_word_id) as Pick<Word,'headword'|'phonetic'|'meaning_zh'|'meaning_source'>;
    if(!duplicate&&hasDictionaryPlaceholder(expected.headword))throw new QuizError('题目已更新，请重新开始。',409);
    const selected = db.prepare('SELECT headword,meaning_zh FROM words WHERE id=?').get(chosenId) as Word;
    const correct = chosenId === issue.answer_word_id;
    let due: string;
    if (duplicate) {
      const log = db.prepare('SELECT id FROM review_logs WHERE answer_id=?').get(answerId) as { id: number };
      const next = db.prepare('SELECT due FROM review_logs WHERE card_id=? AND id>? AND COALESCE(counted,1)<>0 ORDER BY id LIMIT 1').get(issue.card_id, log.id) as { due: string } | undefined;
      due = next?.due ?? (db.prepare('SELECT due FROM cards WHERE id=?').get(issue.card_id) as { due: string }).due;
    } else {
      const result = review(db, issue.card_id, correct ? Rating.Good : Rating.Again, now, { qtype: issue.qtype, context: issue.context, answer: selected.headword, correct, answerId, durationMs });
      due = result.card.due.toISOString();
      db.prepare('UPDATE question_issues SET answered_at=?,chosen_word_id=?,answer_id=? WHERE id=?').run(now.toISOString(), chosenId, answerId, questionId);
    }
    return { ok: true, correct, answerWordId: issue.answer_word_id, chosenWordId: chosenId, expected:{...expected,headword:displayHeadword(db,issue.answer_word_id,expected.headword)}, chosen: { headword: displayHeadword(db,chosenId,selected.headword), meaning_first_line: first(selected.meaning_zh) }, due, duplicate };
  })();
}
