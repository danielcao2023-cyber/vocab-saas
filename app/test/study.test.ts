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

describe('curriculum spelling rules', () => {
  it.each([
    ['a / an', ['a', 'an']],
    ['according (to)', ['according', 'according to']],
    ['colour (AmE color)', ['colour', 'color']],
    ['theatre (Am E theater)', ['theatre', 'theater']],
    ['maths (=mathematics, AmE math)', ['maths', 'math']],
    ['Mr (AmE Mr.)', ['mr', 'mr.']],
    ['child (pl. children)', ['child']],
    ['ad (=advertisement)', ['ad']],
    ['father (dad)', ['father', 'dad']],
    ['mother (mum AmE mom)', ['mother', 'mum', 'mom']],
    ['be (am, is, are)', ['be', 'am', 'is', 'are']],
    ['policeman / policewoman (pl. policemen / policewomen)', ['policeman', 'policewoman']],
    ['per cent (AmE percent)', ['per cent', 'percent']],
    ['o’clock', ["o'clock"]],
    ['T-shirt', ['t-shirt']],
    ['Miss', ['miss']],
    ['a (an)', ['a', 'an']],
    ['color (colour)', ['color', 'colour']],
  ])('%s accepts only the intended variants', (headword, expected) => {
    expect(acceptedSpellings(headword as string)).toEqual(expected);
  });
  it.each([
    ["o'clock", 'o’clock'], ["o'clock", 'O’Clock '], ["o'clock", "o'clock"], ['o’clock', "o'clock"],
  ])('matches normalized quotes: %s / %s', (headword, answer) => {
    db.prepare('UPDATE words SET headword=? WHERE id=1').run(headword);
    const c = nextCard(db, T0)!; review(db, c.id as number, Rating.Easy, T0);
    const sp = db.prepare("SELECT id FROM cards WHERE word_id=1 AND mode='spell'").get() as { id: number };
    expect(checkSpelling(db, sp.id, answer, day(1)).correct).toBe(true);
  });
});

describe('curriculum new-word ordering', () => {
  function prepare(core = 10, secondary = 3, every = 5) {
    db.exec('DELETE FROM words');
    db.prepare("UPDATE settings SET value='50' WHERE key='new_per_day'").run();
    db.prepare("UPDATE settings SET value=? WHERE key='level2_every'").run(String(every));
    const ins = db.prepare('INSERT INTO words(headword,source,priority,freq_rank) VALUES (?,\'kb2022\',?,?)');
    // Reverse insertion order distinguishes frequency from id ordering.
    for (let i = core; i >= 1; i--) ins.run('core' + i, 2, i);
    for (let i = secondary; i >= 1; i--) ins.run('level2-' + i, 1, i);
    ins.run('other', 0, 1);
  }
  function learn(n: number) {
    const heads: unknown[] = [];
    for (let i = 0; i < n; i++) {
      const c = nextCard(db, T0, 'new')!; heads.push(c.headword);
      review(db, c.id as number, Rating.Easy, T0);
    }
    return heads;
  }
  it('interleaves every fifth curriculum recognition card and orders each group by frequency', () => {
    prepare();
    expect(learn(13)).toEqual(['core1', 'core2', 'core3', 'core4', 'level2-1', 'core5', 'core6', 'core7', 'core8', 'level2-2', 'core9', 'core10', 'level2-3']);
    expect(learn(1)).toEqual(['other']);
  });
  it('finishes core words first when level2_every is zero', () => {
    prepare(5, 2, 0);
    expect(learn(7)).toEqual(['core1', 'core2', 'core3', 'core4', 'core5', 'level2-1', 'level2-2']);
  });
  it('falls back to core when the secondary group is exhausted', () => {
    prepare(10, 1);
    expect(learn(11)).toEqual(['core1', 'core2', 'core3', 'core4', 'level2-1', 'core5', 'core6', 'core7', 'core8', 'core9', 'core10']);
  });
  it('serves existing unlearned cards by card id before creating new cards', () => {
    prepare(3, 0);
    const ids = db.prepare('SELECT id FROM words WHERE priority=2 ORDER BY id').all() as { id: number }[];
    const ins = db.prepare("INSERT INTO cards(word_id,mode,due,stability,difficulty,elapsed_days,scheduled_days,reps,lapses,state) VALUES (?,'recognize',?,0,0,0,0,0,0,0)");
    ins.run(ids[1].id, T0.toISOString()); ins.run(ids[0].id, T0.toISOString());
    expect(learn(3)).toEqual(['core2', 'core3', 'core1']);
  });
  it('puts missing frequencies last and counts curriculum cards only', () => {
    prepare(2, 1, 2);
    db.prepare("UPDATE words SET freq_rank=NULL WHERE headword='core1'").run();
    // Existing priority=0 recognition cards must not advance the curriculum cadence.
    const other = db.prepare("SELECT id FROM words WHERE headword='other'").get() as { id: number };
    db.prepare("INSERT INTO cards(word_id,mode,due,stability,difficulty,elapsed_days,scheduled_days,reps,lapses,state) VALUES (?,'recognize',?,5,5,1,1,1,0,2)").run(other.id, day(5).toISOString());
    expect(learn(3)).toEqual(['core2', 'level2-1', 'core1']);
  });
  it('breaks equal frequencies by word id within a group', () => {
    prepare(3, 0, 0);
    db.prepare('UPDATE words SET freq_rank=100 WHERE priority=2').run();
    expect(learn(3)).toEqual(['core3', 'core2', 'core1']);
  });
});
