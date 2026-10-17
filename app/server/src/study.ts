import { createEmptyCard, fsrs, Rating, State, type Card, type Grade } from 'ts-fsrs';
import type { DB } from './db.ts';
import { freshWordId } from './learn-order.ts';
import { statusKey } from './word-status.ts';
import { shDay, shDayStart } from './time.ts';
import { mainHeadwords, normalizeQuotes } from './text.ts';
import { setting } from './settings.ts';
import { recomputeDailyStats, streak } from './stats.ts';
import { issueQuestion, availableQtypes, type Qtype, type Context, type Rng } from './quiz.ts';

const scheduler = fsrs({ enable_fuzz: false });
export type Mode = 'recognize' | 'spell' | 'dictation';

export interface CardRow {
  id: number; word_id: number; mode: Mode; due: string; stability: number; difficulty: number;
  elapsed_days: number; scheduled_days: number; learning_steps: number; reps: number; lapses: number;
  state: number; last_review: string | null;
}

function toCard(r: CardRow): Card {
  return {
    due: new Date(r.due), stability: r.stability, difficulty: r.difficulty, elapsed_days: r.elapsed_days,
    scheduled_days: r.scheduled_days, learning_steps: r.learning_steps, reps: r.reps, lapses: r.lapses,
    state: r.state as State, last_review: r.last_review ? new Date(r.last_review) : undefined,
  };
}

function insertCard(db: DB, wordId: number, mode: Mode, now: Date) {
  const c = createEmptyCard(now);
  db.prepare(`INSERT OR IGNORE INTO cards(word_id,mode,due,stability,difficulty,elapsed_days,scheduled_days,learning_steps,reps,lapses,state,last_review)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,NULL)`).run(wordId, mode, c.due.toISOString(), c.stability, c.difficulty,
    c.elapsed_days, c.scheduled_days, c.learning_steps, c.reps, c.lapses, c.state);
}

/** 今天已经学过的新词数（认词卡首次复习发生在今天） */
export function newIntroducedToday(db: DB, now: Date): number {
  const r = db.prepare(`SELECT COUNT(*) n FROM review_logs l JOIN cards c ON c.id=l.card_id
    WHERE c.mode='recognize' AND l.state=${State.New} AND COALESCE(l.counted,1)<>0 AND l.review_at >= ? AND l.review_at<=?`).get(shDayStart(now).toISOString(), now.toISOString()) as { n: number };
  return r.n;
}

export const CARD_SELECT = `SELECT c.*, w.headword, w.phonetic, w.pos, w.meaning_zh, w.meaning_flag, w.meaning_source, w.source, w.is_sample, w.level FROM cards c JOIN words w ON w.id=c.word_id`;

/** 到期判定：首页计数和出卡用同一个条件 */
export const DUE_WHERE = `(c.state<>${State.New} OR c.mode<>'recognize') AND c.due <= ?`;

export function reviewedToday(db: DB, now: Date): number {
  return (db.prepare(`SELECT COUNT(*) n FROM review_logs WHERE state<>${State.New} AND COALESCE(counted,1)<>0 AND review_at >= ? AND review_at<=?`).get(shDayStart(now).toISOString(), now.toISOString()) as { n: number }).n;
}

/** 当前可出的复习数和新词数（首页与 nextCard 共用同一函数） */
export function queueState(db: DB, now = new Date()) {
  const due = (db.prepare(`SELECT COUNT(*) n FROM cards c WHERE ${DUE_WHERE}`).get(now.toISOString()) as { n: number }).n;
  const reviewLeft = Math.max(0, setting(db, 'review_limit', 200) - reviewedToday(db, now));
  const newQuota = Math.max(0, setting(db, 'new_per_day', 10) - newIntroducedToday(db, now));
  const unseen = (db.prepare(`SELECT COUNT(*) n FROM words w WHERE NOT EXISTS (SELECT 1 FROM cards c WHERE c.word_id=w.id AND c.mode='recognize' AND c.state<>${State.New})`).get() as { n: number }).n;
  return { review: Math.min(due, reviewLeft), new: Math.min(newQuota, unseen) };
}

export function todaySummary(db: DB, now = new Date()) {
  const q = queueState(db, now);
  // 估算：复习 20 秒/个，新词 40 秒/个
  const completed = !!db.prepare('SELECT 1 FROM daily_stats WHERE day=? AND completed=1').get(shDay(now));
  return { day: shDay(now), review: q.review, new: q.new, minutes: Math.ceil((q.review * 20 + q.new * 40) / 60), completed, streak: streak(db, now).current };
}

/** 下一张卡：先到期复习，再新词。prefer='new' 时先新词。 */
export function nextCard(db: DB, now = new Date(), prefer: 'review' | 'new' = 'review') {
  const q = queueState(db, now);
  const due = () => q.review > 0 ? db.prepare(`${CARD_SELECT} WHERE ${DUE_WHERE} ORDER BY c.due LIMIT 1`).get(now.toISOString()) : undefined;
  const fresh = () => {
    if (q.new <= 0) return undefined;
    let row = db.prepare(`${CARD_SELECT} WHERE c.mode='recognize' AND c.state=${State.New} ORDER BY c.id LIMIT 1`).get();
    if (!row) {
      const id = freshWordId(db);
      const w = id === undefined ? undefined : { id };
      if (!w) return undefined;
      insertCard(db, w.id, 'recognize', now);
      row = db.prepare(`${CARD_SELECT} WHERE c.word_id=? AND c.mode='recognize'`).get(w.id);
    }
    return row;
  };
  const row = (prefer === 'new' ? (fresh() ?? due()) : (due() ?? fresh())) as (CardRow & Record<string, unknown>) | undefined;
  return row ?? null;
}

function addWrong(db: DB, wordId: number, now: Date) {
  db.prepare(`INSERT INTO wrong_words(word_id,wrong_count,last_wrong_at,correct_days,removed_at) VALUES (?,1,?,'[]',NULL)
    ON CONFLICT(word_id) DO UPDATE SET wrong_count=wrong_count+1,last_wrong_at=excluded.last_wrong_at,correct_days='[]',removed_at=NULL`)
    .run(wordId, now.toISOString());
}

/** 错词本：答对按上海日期去重，跨天答对 3 次后自动移出 */
function markCorrectForWrong(db: DB, wordId: number, now: Date) {
  const r = db.prepare('SELECT correct_days FROM wrong_words WHERE word_id=? AND removed_at IS NULL').get(wordId) as { correct_days: string } | undefined;
  if (!r) return;
  const days = new Set<string>(JSON.parse(r.correct_days));
  days.add(shDay(now));
  const removed = days.size >= 3 ? now.toISOString() : null;
  db.prepare('UPDATE wrong_words SET correct_days=?, removed_at=? WHERE word_id=?').run(JSON.stringify([...days]), removed, wordId);
}

export function countsTowardGraduation(rating: number) { return rating === Rating.Good || rating === Rating.Easy; }

export function review(db: DB, cardId: number, rating: Grade, now = new Date(), extra: { durationMs?: number; answer?: string; correct?: boolean; answerId?: string; qtype?: Qtype; context?: Context } = {}): { card: Card; duplicate: boolean } {
  if (extra.answerId) {
    const prev = db.prepare('SELECT card_id FROM review_logs WHERE answer_id=?').get(extra.answerId) as { card_id: number } | undefined;
    if (prev) return { card: toCard(db.prepare('SELECT * FROM cards WHERE id=?').get(prev.card_id) as CardRow), duplicate: true };
  }
  if (![Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].includes(rating)) throw new Error('bad rating');
  const row = db.prepare('SELECT * FROM cards WHERE id=?').get(cardId) as CardRow | undefined;
  if (!row) throw new Error('card not found');
  if (extra.durationMs !== undefined && (!Number.isFinite(extra.durationMs) || extra.durationMs < 0)) throw new Error('bad durationMs');
  const context = extra.context ?? 'study';
  if (!['study','practice'].includes(context)) throw new Error('bad context');
  const qtype = extra.qtype ?? (row.mode === 'recognize' ? 'flip' : row.mode);
  const already = db.prepare(`SELECT 1 FROM review_logs WHERE card_id=? AND COALESCE(counted,1)<>0 AND review_at>=? AND review_at<=? LIMIT 1`).get(cardId, shDayStart(now).toISOString(), now.toISOString());
  const counted = context === 'practice' && already ? 0 : 1;
  const scheduled = counted ? scheduler.next(toCard(row), now, rating) : null;
  const card = scheduled?.card ?? toCard(row);
  const log = scheduled?.log ?? { ...row, due: new Date(row.due) };
  db.transaction(() => {
    if (counted) db.prepare(`UPDATE cards SET due=?,stability=?,difficulty=?,elapsed_days=?,scheduled_days=?,learning_steps=?,reps=?,lapses=?,state=?,last_review=? WHERE id=?`)
      .run(card.due.toISOString(), card.stability, card.difficulty, card.elapsed_days, card.scheduled_days, card.learning_steps,
        card.reps, card.lapses, card.state, now.toISOString(), cardId);
    db.prepare(`INSERT INTO review_logs(card_id,rating,state,due,stability,difficulty,elapsed_days,scheduled_days,review_at,duration_ms,answer,correct,answer_id,qtype,counted,context)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(cardId, rating, log.state, row.due, log.stability, log.difficulty,
        log.elapsed_days, log.scheduled_days, now.toISOString(), extra.durationMs ?? null, extra.answer ?? null,
        extra.correct === undefined ? null : extra.correct ? 1 : 0, extra.answerId ?? null, qtype, counted, context);
    if (rating === Rating.Again) addWrong(db, row.word_id, now); else if (countsTowardGraduation(rating)) markCorrectForWrong(db, row.word_id, now);
    // 认词卡第一次学过后，开启拼写和听写卡（明天起出现）
    if (counted && row.mode === 'recognize' && row.state === State.New) {
      const tomorrow = new Date(shDayStart(now).getTime() + 86400_000);
      insertCard(db, row.word_id, 'spell', tomorrow);
      insertCard(db, row.word_id, 'dictation', tomorrow);
    }
    recomputeDailyStats(db, [shDay(now)]);
  })();
  return { card, duplicate: false };
}

export function normalizeAnswer(s: string) { return normalizeQuotes(s).trim().toLowerCase().replace(/\s+/g, ' '); }

/** 主词头、裸写变体和 AmE 变体可接受；全称和复数注释不可接受。 */
export function acceptedSpellings(headword: string): string[] {
  const normalized = normalizeQuotes(headword);
  const main = mainHeadwords(normalized).map(normalizeAnswer);
  const variants: string[] = [];
  for (const match of normalized.matchAll(/[(（](.*?)[)）]/g)) {
    const inner = match[1].trim();
    if (main[0] === 'according' && normalizeAnswer(inner) === 'to') {
      variants.push('according to');
      continue;
    }
    // pl. applies to the whole annotation, including slashes within it.
    if (/^pl\./i.test(inner)) continue;
    const parts = inner.split(/\bAm\s?E\s+/);
    const bare = parts.shift()!;
    if (!bare.trim().startsWith('=')) variants.push(...bare.split(/[,，/]/));
    variants.push(...parts.flatMap((part) => part.split(/[,，/]/)));
  }
  const accepted = variants.map(normalizeAnswer).filter((part) => /^[a-z' .-]+$/.test(part));
  return [...new Set([...main, ...accepted])];
}

/** 拼写/听写：严格比对（忽略大小写和首尾空格），对→认识(Good)，错→忘了(Again)；用了提示→模糊(Hard) */
export function checkSpelling(db: DB, cardId: number, answer: string, now = new Date(), usedHint = false, answerId?: string, extra: { context?: Context; durationMs?: number } = {}) {
  const row = db.prepare(`SELECT c.mode, w.headword FROM cards c JOIN words w ON w.id=c.word_id WHERE c.id=?`).get(cardId) as { mode: Mode; headword: string } | undefined;
  if (!row) throw new Error('card not found');
  if (row.mode === 'recognize') throw new Error('not a spelling card');
  const correct = acceptedSpellings(row.headword).includes(normalizeAnswer(answer));
  const rating = correct ? (usedHint ? Rating.Hard : Rating.Good) : Rating.Again;
  const r = review(db, cardId, rating as Grade, now, { ...extra, qtype: row.mode, answer, correct, answerId });
  return { correct, expected: row.headword, rating, due: r.card.due.toISOString(), duplicate: r.duplicate };
}

/** 四档掌握度：看认词卡。新词=没学过；学习中=学习/重学阶段或稳定度<7天；熟悉=7–21天；掌握=稳定度≥21天 */
export function progress(db: DB) {
  const lists = db.prepare(`SELECT source, MAX(is_sample) is_sample, COUNT(*) total FROM words GROUP BY source`).all() as { source: string; is_sample: number; total: number }[];
  return lists.map((l) => {
    const r = { new:0, learning:0, familiar:0, mastered:0 };
    const cards = db.prepare(`SELECT c.state,c.stability FROM words w LEFT JOIN cards c ON c.word_id=w.id AND c.mode='recognize' WHERE w.source=?`).all(l.source) as {state:number|null;stability:number|null}[];
    for (const c of cards) r[statusKey(c)]++;
    return { source:l.source, isSample:!!l.is_sample, total:l.total, ...r };
  });
}

export type WrongSort = 'count' | 'recent';
export function wrongList(db: DB, sort: WrongSort = 'count') {
  return (db.prepare(`SELECT w.id word_id,w.headword,w.phonetic,w.meaning_zh,ww.wrong_count,ww.last_wrong_at,ww.correct_days
    FROM wrong_words ww JOIN words w ON w.id=ww.word_id WHERE ww.removed_at IS NULL
    ORDER BY ${sort === 'recent' ? 'ww.last_wrong_at DESC,ww.word_id' : 'ww.wrong_count DESC,ww.last_wrong_at DESC,ww.word_id'}`).all() as any[])
    .map(r => ({ ...r, correct_days: JSON.parse(r.correct_days).length, fails: Object.fromEntries((db.prepare(`SELECT COALESCE(l.qtype,CASE c.mode WHEN 'recognize' THEN 'flip' ELSE c.mode END) qtype,COUNT(*) n
      FROM review_logs l JOIN cards c ON c.id=l.card_id WHERE c.word_id=? AND (l.correct=0 OR l.rating=1) GROUP BY 1`).all(r.word_id) as { qtype: string; n: number }[]).map(f => [f.qtype, f.n])) }));
}
export function wrongSummary(db: DB, sort: WrongSort = 'count', now = new Date()) {
  const items = wrongList(db, sort);
  // 移出进度：correct_days 只由 Good/Easy 写入（Hard 不动，Again/手动放回清零），满 3 个不同日子就移出；
  // 所以“还在本里、恰好 2 个不同日子”= 再对 1 天就移出。不看本周，不看次数。
  const rows = db.prepare('SELECT correct_days FROM wrong_words WHERE removed_at IS NULL').all() as { correct_days: string }[];
  return { items, total: items.length, twoCorrectDays: rows.filter(r => new Set(JSON.parse(r.correct_days) as string[]).size === 2).length };
}
export function setWrong(db: DB, wordId: number, inBook: boolean, now = new Date()) {
  if (inBook) db.prepare(`INSERT INTO wrong_words(word_id,wrong_count,last_wrong_at,correct_days,removed_at) VALUES (?,0,?,'[]',NULL)
    ON CONFLICT(word_id) DO UPDATE SET correct_days='[]',removed_at=NULL`).run(wordId, now.toISOString());
  else db.prepare('UPDATE wrong_words SET removed_at=? WHERE word_id=?').run(now.toISOString(), wordId);
}

export function wrongPractice(db: DB, limit = 10, now = new Date(), rng: Rng = Math.random, sort: WrongSort = 'count') {
  const items = wrongList(db, sort).slice(0, limit).map(word => {
    const cards = db.prepare(`${CARD_SELECT} WHERE c.word_id=?`).all(word.word_id) as (CardRow & Record<string, any>)[];
    const recognize = cards.find(c => c.mode === 'recognize');
    if (!recognize) return null;
    const available = availableQtypes(db, recognize, cards);
    const failed = db.prepare(`SELECT COALESCE(l.qtype,CASE c.mode WHEN 'recognize' THEN 'flip' ELSE c.mode END) qtype
      FROM review_logs l JOIN cards c ON c.id=l.card_id WHERE c.word_id=? AND (l.correct=0 OR l.rating=1)
      GROUP BY 1 ORDER BY MAX(l.review_at) DESC,MAX(l.id) DESC`).all(word.word_id) as { qtype: Qtype }[];
    const latest = failed.find(f => available.includes(f.qtype))?.qtype;
    const types = latest ? available : available.filter(q => !['spell','dictation'].includes(q));
    const qtype = latest && rng() < .7 ? latest : types[Math.min(types.length - 1, Math.floor(rng() * types.length))];
    const card = qtype === 'spell' || qtype === 'dictation' ? cards.find(c => c.mode === qtype)! : recognize;
    return { card, question: issueQuestion(db, card, now, 'practice', rng, qtype) };
  }).filter((r): r is NonNullable<typeof r> => r !== null);
  return { items };
}

/** 练错词只接受错词本里的词（或今天刚移出的词：同一轮里刚毕业/刚放回，晚到的提交仍然有效） */
export function practiceAllowed(db: DB, cardId: number, now = new Date()) {
  return !!db.prepare(`SELECT 1 FROM cards c JOIN wrong_words ww ON ww.word_id=c.word_id WHERE c.id=? AND (ww.removed_at IS NULL OR ww.removed_at>=?)`).get(cardId, shDayStart(now).toISOString());
}
