import { describe, it, expect, beforeEach } from 'vitest';
import { Rating, State } from 'ts-fsrs';
import { openDb, type DB } from '../server/src/db.ts';
import { acceptedSpellings, checkSpelling, nextCard, progress, review, todaySummary, wrongList } from '../server/src/study.ts';
import { buildApp } from '../server/src/app.ts';

let db: DB;
const T0 = new Date('2026-10-17T01:00:00Z'); // 上海 09:00
const day = (n: number) => new Date(T0.getTime() + n * 86400_000);

beforeEach(() => {
  db = openDb(':memory:');
  const ins = db.prepare('INSERT INTO words(headword,phonetic,meaning_zh,source,level) VALUES (?,?,?,?,?)');
  for (const w of ['apple', 'banana', 'cherry']) ins.run(w, '/x/', '释义', 't', '示例');
  db.prepare("UPDATE settings SET value='2' WHERE key='new_per_day'").run();
});

describe('daily queue & FSRS', () => {
  it('respects new_per_day and schedules via FSRS', () => {
    expect(todaySummary(db, T0)).toMatchObject({ new: 2, review: 0 });
    const c1 = nextCard(db, T0)!; expect(c1.headword).toBe('apple');
    const after = review(db, c1.id as number, Rating.Good, T0).card;
    expect(after.state).toBe(State.Learning);
    expect(after.due.getTime()).toBeGreaterThan(T0.getTime());
    const c2 = nextCard(db, T0)!; review(db, c2.id as number, Rating.Easy, T0);
    expect(nextCard(db, T0)).toBeNull(); // 新词额度用完，apple 的学习步还没到期
    const row = db.prepare("SELECT reps,state FROM cards WHERE word_id=1 AND mode='recognize'").get() as any;
    expect(row.reps).toBe(1);
    expect(db.prepare('SELECT COUNT(*) n FROM review_logs').get()).toEqual({ n: 2 });
  });

  it('opens spell + dictation cards from tomorrow after first learn', () => {
    const c = nextCard(db, T0)!; review(db, c.id as number, Rating.Easy, T0);
    const modes = db.prepare('SELECT mode FROM cards WHERE word_id=1 ORDER BY mode').all().map((r: any) => r.mode);
    expect(modes).toEqual(['dictation', 'recognize', 'spell']);
    const tomorrow = nextCard(db, day(1))!;
    expect(['spell', 'dictation', 'recognize']).toContain(tomorrow.mode);
  });

  it('again puts word into wrong book; 3 correct days removes it', () => {
    const c = nextCard(db, T0)!; review(db, c.id as number, Rating.Again, T0);
    expect(wrongList(db).map((w: any) => w.headword)).toEqual(['apple']);
    for (const n of [1, 2, 3]) review(db, c.id as number, Rating.Good, day(n));
    expect(wrongList(db)).toEqual([]);
  });

  it('spelling check is strict but case/space-insensitive', () => {
    const c = nextCard(db, T0)!; review(db, c.id as number, Rating.Good, T0);
    const sp = db.prepare("SELECT id FROM cards WHERE word_id=1 AND mode='spell'").get() as any;
    expect(checkSpelling(db, sp.id, '  Apple ', day(1)).correct).toBe(true);
    const r = checkSpelling(db, sp.id, 'aple', day(2));
    expect(r).toMatchObject({ correct: false, expected: 'apple', rating: Rating.Again });
    expect(wrongList(db).length).toBe(1);
    expect(() => checkSpelling(db, c.id as number, 'apple', day(2))).toThrow();
  });

  it('accepts variants in parentheses', () => {
    expect(acceptedSpellings('a (an)')).toEqual(['a', 'an']);
    expect(acceptedSpellings('color (colour)')).toEqual(['color', 'colour']);
    expect(acceptedSpellings('T-shirt')).toEqual(['t-shirt']);
  });

  it('progress counts four tiers by list', () => {
    const c = nextCard(db, T0)!; review(db, c.id as number, Rating.Good, T0);
    expect(progress(db)[0]).toMatchObject({ source: 't', total: 3, new: 2, learning: 1, familiar: 0, mastered: 0 });
  });

  it('API: health, next, review, check', async () => {
    const app = buildApp(db, { now: () => T0 });
    expect((await app.inject('/health')).json()).toMatchObject({ ok: true, words: 3 });
    const card = (await app.inject('/api/next')).json().card;
    const r = await app.inject({ method: 'POST', url: '/api/review', payload: { cardId: card.id, rating: 3 } });
    expect(r.json().ok).toBe(true);
    const bad = await app.inject({ method: 'POST', url: '/api/review', payload: { cardId: card.id, rating: 9 } });
    expect(bad.statusCode).toBe(400);
  });
});

describe('queue consistency & idempotency', () => {
  it('home review count == cards actually served', () => {
    const ins = db.prepare("INSERT INTO cards(word_id,mode,due,stability,difficulty,elapsed_days,scheduled_days,reps,lapses,state,last_review) VALUES (?,?,?,5,5,1,1,2,0,2,?)");
    const past = new Date(T0.getTime() - 3600_000).toISOString();
    const laterToday = new Date(T0.getTime() + 3 * 3600_000).toISOString(); // 今天晚些到期：不应计入
    ins.run(1, 'recognize', past, past); ins.run(1, 'spell', past, past); ins.run(2, 'recognize', past, past);
    ins.run(2, 'dictation', laterToday, past); ins.run(3, 'recognize', past, past);
    db.prepare("UPDATE settings SET value='0' WHERE key='new_per_day'").run();
    const shown = todaySummary(db, T0).review;
    expect(shown).toBe(4);
    let served = 0; let c;
    while ((c = nextCard(db, T0)) && served < 50) { review(db, c.id as number, Rating.Easy, T0); served++; }
    expect(served).toBe(shown);
    expect(todaySummary(db, T0).review).toBe(0);
  });

  it('same answerId is applied once', async () => {
    const app = buildApp(db, { now: () => T0 });
    const card = (await app.inject('/api/next')).json().card;
    const body = { cardId: card.id, rating: 1, answerId: 'ans-123' };
    const a = (await app.inject({ method: 'POST', url: '/api/review', payload: body })).json();
    const b = (await app.inject({ method: 'POST', url: '/api/review', payload: body })).json();
    expect(a.duplicate).toBe(false); expect(b.duplicate).toBe(true); expect(b.due).toBe(a.due);
    expect(db.prepare('SELECT COUNT(*) n FROM review_logs').get()).toEqual({ n: 1 });
    expect((db.prepare('SELECT wrong_count FROM wrong_words').get() as any).wrong_count).toBe(1);
  });
});
