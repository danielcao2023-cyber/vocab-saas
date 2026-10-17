import { createEmptyCard, fsrs, Rating, State, type Card, type Grade } from 'ts-fsrs';
import type { DB } from './db.ts';
import { shDay, shDayStart } from './time.ts';

const scheduler = fsrs({ enable_fuzz: false });
export type Mode = 'recognize' | 'spell' | 'dictation';

interface CardRow {
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

function setting(db: DB, key: string, def: number): number {
  const r = db.prepare('SELECT value FROM settings WHERE key=?').get(key) as { value: string } | undefined;
  return r ? Number(r.value) : def;
}

function insertCard(db: DB, wordId: number, mode: Mode, now: Date) {
  const c = createEmptyCard(now);
  db.prepare(`INSERT OR IGNORE INTO cards(word_id,mode,due,stability,difficulty,elapsed_days,scheduled_days,learning_steps,reps,lapses,state,last_review)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,NULL)`).run(wordId, mode, c.due.toISOString(), c.stability, c.difficulty,
    c.elapsed_days, c.scheduled_days, c.learning_steps, c.reps, c.lapses, c.state);
}

/** 今天已经学过的新词数（认词卡首次复习发生在今天） */
function newIntroducedToday(db: DB, now: Date): number {
  const r = db.prepare(`SELECT COUNT(*) n FROM review_logs l JOIN cards c ON c.id=l.card_id
    WHERE c.mode='recognize' AND l.state=${State.New} AND l.review_at >= ?`).get(shDayStart(now).toISOString()) as { n: number };
  return r.n;
}

const CARD_SELECT = `SELECT c.*, w.headword, w.phonetic, w.pos, w.meaning_zh, w.source, w.is_sample FROM cards c JOIN words w ON w.id=c.word_id`;

export function todaySummary(db: DB, now = new Date()) {
  const endOfDay = new Date(shDayStart(now).getTime() + 86400_000).toISOString();
  const review = (db.prepare(`SELECT COUNT(*) n FROM cards WHERE (state<>${State.New} OR mode<>'recognize') AND due < ?`).get(endOfDay) as { n: number }).n;
  const reviewLimit = setting(db, 'review_limit', 200);
  const newLeftQuota = Math.max(0, setting(db, 'new_per_day', 10) - newIntroducedToday(db, now));
  const unseen = (db.prepare(`SELECT COUNT(*) n FROM words w WHERE NOT EXISTS (SELECT 1 FROM cards c WHERE c.word_id=w.id AND c.mode='recognize' AND c.state<>${State.New})`).get() as { n: number }).n;
  const newCount = Math.min(newLeftQuota, unseen);
  const reviewCount = Math.min(review, reviewLimit);
  // 估算：复习 20 秒/个，新词 40 秒/个
  const minutes = Math.ceil((reviewCount * 20 + newCount * 40) / 60);
  return { day: shDay(now), review: reviewCount, new: newCount, minutes };
}

/** 下一张卡：先到期复习，再新词（受每日新词数限制）。prefer='new' 时先新词。 */
export function nextCard(db: DB, now = new Date(), prefer: 'review' | 'new' = 'review') {
  const due = () => db.prepare(`${CARD_SELECT} WHERE (c.state<>${State.New} OR c.mode<>'recognize') AND c.due <= ? ORDER BY c.due LIMIT 1`).get(now.toISOString());
  const fresh = () => {
    if (setting(db, 'new_per_day', 10) - newIntroducedToday(db, now) <= 0) return undefined;
    let row = db.prepare(`${CARD_SELECT} WHERE c.mode='recognize' AND c.state=${State.New} ORDER BY w.id LIMIT 1`).get();
    if (!row) {
      const w = db.prepare(`SELECT id FROM words w WHERE NOT EXISTS (SELECT 1 FROM cards c WHERE c.word_id=w.id AND c.mode='recognize') ORDER BY COALESCE(freq_rank, 999999), id LIMIT 1`).get() as { id: number } | undefined;
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

export function review(db: DB, cardId: number, rating: Grade, now = new Date(), extra: { durationMs?: number; answer?: string; correct?: boolean } = {}) {
  if (![Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].includes(rating)) throw new Error('bad rating');
  const row = db.prepare('SELECT * FROM cards WHERE id=?').get(cardId) as CardRow | undefined;
  if (!row) throw new Error('card not found');
  const { card, log } = scheduler.next(toCard(row), now, rating);
  db.transaction(() => {
    db.prepare(`UPDATE cards SET due=?,stability=?,difficulty=?,elapsed_days=?,scheduled_days=?,learning_steps=?,reps=?,lapses=?,state=?,last_review=? WHERE id=?`)
      .run(card.due.toISOString(), card.stability, card.difficulty, card.elapsed_days, card.scheduled_days, card.learning_steps,
        card.reps, card.lapses, card.state, now.toISOString(), cardId);
    db.prepare(`INSERT INTO review_logs(card_id,rating,state,due,stability,difficulty,elapsed_days,scheduled_days,review_at,duration_ms,answer,correct)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(cardId, rating, log.state, log.due.toISOString(), log.stability, log.difficulty,
        log.elapsed_days, log.scheduled_days, now.toISOString(), extra.durationMs ?? null, extra.answer ?? null,
        extra.correct === undefined ? null : extra.correct ? 1 : 0);
    if (rating === Rating.Again) addWrong(db, row.word_id, now); else markCorrectForWrong(db, row.word_id, now);
    // 认词卡第一次学过后，开启拼写和听写卡（明天起出现）
    if (row.mode === 'recognize' && row.state === State.New) {
      const tomorrow = new Date(shDayStart(now).getTime() + 86400_000);
      insertCard(db, row.word_id, 'spell', tomorrow);
      insertCard(db, row.word_id, 'dictation', tomorrow);
    }
  })();
  return card;
}

export function normalizeAnswer(s: string) { return s.trim().toLowerCase().replace(/\s+/g, ' '); }

/** 拼写/听写：严格比对（忽略大小写和首尾空格），对→认识(Good)，错→忘了(Again)；用了提示→模糊(Hard) */
export function checkSpelling(db: DB, cardId: number, answer: string, now = new Date(), usedHint = false) {
  const row = db.prepare(`SELECT c.mode, w.headword FROM cards c JOIN words w ON w.id=c.word_id WHERE c.id=?`).get(cardId) as { mode: Mode; headword: string } | undefined;
  if (!row) throw new Error('card not found');
  if (row.mode === 'recognize') throw new Error('not a spelling card');
  const correct = normalizeAnswer(answer) === normalizeAnswer(row.headword);
  const rating = correct ? (usedHint ? Rating.Hard : Rating.Good) : Rating.Again;
  const card = review(db, cardId, rating as Grade, now, { answer, correct });
  return { correct, expected: row.headword, rating, due: card.due.toISOString() };
}

/** 四档掌握度：看认词卡。新词=没学过；学习中=学习/重学阶段或稳定度<7天；熟悉=7–21天；掌握=稳定度≥21天 */
export function progress(db: DB) {
  const lists = db.prepare(`SELECT source, MAX(is_sample) is_sample, COUNT(*) total FROM words GROUP BY source`).all() as { source: string; is_sample: number; total: number }[];
  return lists.map((l) => {
    const r = db.prepare(`SELECT
      SUM(CASE WHEN c.id IS NULL OR c.state=${State.New} THEN 1 ELSE 0 END) AS new_,
      SUM(CASE WHEN c.state IN (${State.Learning},${State.Relearning}) OR (c.state=${State.Review} AND c.stability<7) THEN 1 ELSE 0 END) AS learning,
      SUM(CASE WHEN c.state=${State.Review} AND c.stability>=7 AND c.stability<21 THEN 1 ELSE 0 END) AS familiar,
      SUM(CASE WHEN c.state=${State.Review} AND c.stability>=21 THEN 1 ELSE 0 END) AS mastered
      FROM words w LEFT JOIN cards c ON c.word_id=w.id AND c.mode='recognize' WHERE w.source=?`).get(l.source) as Record<string, number>;
    return { source: l.source, isSample: !!l.is_sample, total: l.total, new: r.new_ ?? 0, learning: r.learning ?? 0, familiar: r.familiar ?? 0, mastered: r.mastered ?? 0 };
  });
}

export function wrongList(db: DB) {
  return db.prepare(`SELECT w.id word_id, w.headword, w.phonetic, w.meaning_zh, ww.wrong_count, ww.last_wrong_at, ww.correct_days
    FROM wrong_words ww JOIN words w ON w.id=ww.word_id WHERE ww.removed_at IS NULL ORDER BY ww.wrong_count DESC, ww.last_wrong_at DESC`).all()
    .map((r: any) => ({ ...r, correct_days: JSON.parse(r.correct_days).length }));
}

export function setWrong(db: DB, wordId: number, inBook: boolean, now = new Date()) {
  if (inBook) addWrong(db, wordId, now);
  else db.prepare('UPDATE wrong_words SET removed_at=? WHERE word_id=?').run(now.toISOString(), wordId);
}

/** 练错词本：返回错词本里这些词的认词卡（立即可练，不改调度直到评分） */
export function wrongPractice(db: DB, limit = 10) {
  return db.prepare(`${CARD_SELECT} JOIN wrong_words ww ON ww.word_id=c.word_id WHERE ww.removed_at IS NULL AND c.mode='recognize'
    ORDER BY ww.wrong_count DESC LIMIT ?`).all(limit);
}
