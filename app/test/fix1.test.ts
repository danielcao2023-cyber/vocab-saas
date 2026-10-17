// v3 第一期 fix round 1：独立验收 15:35 报告（qa/v3-phase1/结果.md）缺陷 1、2 和小问题 3–6、8 的回归测试
import { it, expect, describe } from 'vitest';
import { State } from 'ts-fsrs';
import fs from 'node:fs';
import { buildApp } from '../server/src/app.ts';
import { buildQuestion, issueQuestion, meaningsOverlap } from '../server/src/quiz.ts';
import { setWrong, wrongPractice } from '../server/src/study.ts';
import { makeup, streak } from '../server/src/stats.ts';
import { maskAnswer } from '../server/src/text.ts';
import { isNearMiss } from '../web/src/diff.ts';
import { COPY } from '../web/src/copy.ts';
import { vueSources } from './vue-sources.ts';
import { card, database, day, T } from './v3-helpers.ts';

describe('MUST 1: no self-rating while a choice question is pending in any context', () => {
  const setup = () => {
    const db = database(); const id = card(db, 1, 'recognize', State.Learning, '2026-10-14T11:24:00.000Z');
    return { db, id, app: buildApp(db, { now: () => T, rng: () => .5 }) };
  };
  it('reproduces the report: study question pending → POST /api/review {cardId,rating:4,context:"practice"} is 409 and nothing changes', async () => {
    const { db, id, app } = setup();
    setWrong(db, 1, true, T); // even a wrong-book word must not bypass a pending question
    const next = (await app.inject('/api/next')).json(); expect(next.card.id).toBe(id); expect(next.question).toBeTruthy();
    const before = db.prepare('SELECT * FROM cards WHERE id=?').get(id);
    for (const context of ['practice', 'study', undefined]) {
      const r = await app.inject({ method: 'POST', url: '/api/review', payload: { cardId: id, rating: 4, ...(context ? { context } : {}) } });
      expect(r.statusCode).toBe(409);
    }
    expect(db.prepare('SELECT * FROM cards WHERE id=?').get(id)).toEqual(before);
    expect(db.prepare('SELECT COUNT(*) n FROM review_logs').get()).toEqual({ n: 0 });
    expect(db.prepare('SELECT answered_at FROM question_issues WHERE id=?').get(next.question.id)).toEqual({ answered_at: null });
    await app.close(); db.close();
  });
  it('practice question pending → study flip review is 409; study then gets a choice question (no deadlock) and can answer it', async () => {
    const { db, id, app } = setup();
    setWrong(db, 1, true, T);
    const p = issueQuestion(db, { id, word_id: 1, mode: 'recognize', state: State.Learning }, T, 'practice', () => .5, 'meaning_choice')!;
    expect(p).toBeTruthy();
    expect((await app.inject({ method: 'POST', url: '/api/review', payload: { cardId: id, rating: 3, context: 'study' } })).statusCode).toBe(409);
    db.prepare("UPDATE settings SET value='1,0,0' WHERE key='choice_weights'").run(); // would normally pick flip
    const next = (await app.inject('/api/next')).json();
    expect(next.question?.qtype).toBe('meaning_choice');
    expect(db.prepare('SELECT context FROM question_issues WHERE id=?').get(next.question.id)).toEqual({ context: 'study' });
    expect((await app.inject({ method: 'POST', url: '/api/answer', payload: { questionId: next.question.id, choiceWordId: 1, answerId: 's1' } })).json().correct).toBe(true);
    await app.close(); db.close();
  });
  it('practice-context /api/review and /api/check only accepted for wrong-book words (or removed today); replays still idempotent', async () => {
    const db = database(); const id = card(db, 1, 'recognize', State.Review); const sid = card(db, 2, 'spell', State.Review);
    db.prepare("UPDATE settings SET value='0' WHERE key='choice_enabled'").run();
    const app = buildApp(db, { now: () => T });
    const rev = (answerId: string) => app.inject({ method: 'POST', url: '/api/review', payload: { cardId: id, rating: 4, context: 'practice', answerId } });
    expect((await rev('x1')).statusCode).toBe(409);
    expect((await app.inject({ method: 'POST', url: '/api/check', payload: { cardId: sid, answer: 'word2', context: 'practice', answerId: 'c1' } })).statusCode).toBe(409);
    expect(db.prepare('SELECT COUNT(*) n FROM review_logs').get()).toEqual({ n: 0 });
    setWrong(db, 1, true, day(-1));
    expect((await rev('x2')).statusCode).toBe(200);
    setWrong(db, 1, false, T); // 今天刚移出：晚到的提交仍有效
    expect((await rev('x3')).statusCode).toBe(200);
    expect((await rev('x2')).json().duplicate).toBe(true);
    // 非 practice（study）不受错词本限制
    expect((await app.inject({ method: 'POST', url: '/api/check', payload: { cardId: sid, answer: 'word2', answerId: 'c2' } })).statusCode).toBe(200);
    await app.close(); db.close();
  });
  it('cards issued by /api/wrong/practice are accepted in practice context', async () => {
    const db = database(); const id = card(db, 1, 'recognize', State.Review);
    db.prepare("UPDATE settings SET value='0' WHERE key='choice_enabled'").run();
    setWrong(db, 1, true, T);
    const app = buildApp(db, { now: () => T });
    const items = (await app.inject('/api/wrong/practice')).json().items; expect(items[0].card.id).toBe(id); expect(items[0].question).toBeNull();
    expect((await app.inject({ method: 'POST', url: '/api/review', payload: { cardId: id, rating: 3, context: 'practice', answerId: 'p1' } })).statusCode).toBe(200);
    await app.close(); db.close();
  });
});

describe('MUST 2: wrong-book copy says 3 distinct days, nowhere says 连续 3 天', () => {
  it('copy text', () => {
    expect(COPY.wrongRule).toBe('3 个不同的日子答对会自动移出。');
    expect(COPY.wrongEmptyNote).toBe('答错或点了「忘了」的词会自动放进来，在 3 个不同的日子答对就会移出。');
    const all = [fs.readFileSync('web/src/copy.ts', 'utf8'), ...vueSources().map(s => s.text)].join('\n');
    expect(all).not.toMatch(/连续\s*3\s*天/);
  });
});

describe('minor fixes', () => {
  it('(a) 差一点 only for near misses', () => {
    expect(isNearMiss('recieve', 'receive')).toBe(true);
    expect(isNearMiss('wrod1', 'word1')).toBe(true);
    expect(isNearMiss('aple', 'apple')).toBe(true);
    expect(isNearMiss('zzz', 'receive')).toBe(false);
    expect(isNearMiss('zzz', 'cat')).toBe(false);
    expect(isNearMiss('cot', 'cat')).toBe(true);
    expect(isNearMiss('Ms', 'Ms (AmE Ms.)')).toBe(true);
    expect(isNearMiss('', 'cat')).toBe(false);
  });
  it('(b) streak exposes todayDone and reasons for missed days that cannot be made up', () => {
    const db = database(); const s = streak(db, T);
    expect(s.todayDone).toBe(false); expect(typeof s.makeupBlocked).toBe('object');
    db.close();
  });
  it('(d) masking: headword → ～, base form in a form note → 某词; server prompt/options are masked', () => {
    expect(maskAnswer('adj. 失去的, 遗失的, 迷惑的\nlose的过去式和过去分词', 'lost')).toBe('adj. 失去的, 遗失的, 迷惑的\n某词的过去式和过去分词');
    expect(maskAnswer('aux. 可能，也许（may 的过去式）', 'might')).toBe('aux. 可能，也许（某词 的过去式）');
    expect(maskAnswer('n. 一会儿（for a while）', 'while')).toBe('n. 一会儿（for a ～）');
    expect(maskAnswer('n. 心跳\nbeat的过去式', 'beat')).toBe('n. 心跳\n～的过去式');
    expect(maskAnswer('n. 女士（AmE Ms.）', 'Ms (AmE Ms.)')).toBe('n. 女士（AmE ～）');
    expect(maskAnswer('n. 几点钟（o’clock）', "o'clock")).toBe('n. 几点钟（～）');
    const db = database(8); const id = card(db);
    db.prepare("UPDATE words SET headword='lost',meaning_zh='adj. 失去的\nlose的过去式和过去分词' WHERE id=1").run();
    const q = buildQuestion(db, { id, word_id: 1, mode: 'recognize', state: 2 }, 'meaning_choice', () => .5)!;
    expect(q.prompt).toBe('adj. 失去的\n某词的过去式和过去分词');
    db.prepare("UPDATE words SET headword='dear',meaning_zh='interj. 哎呀（Oh dear）' WHERE id=1").run();
    const l = buildQuestion(db, { id, word_id: 1, mode: 'recognize', state: 2 }, 'listen_choice', () => .5)!;
    expect(l.options.find(o => o.wordId === 1)!.text).toBe('interj. 哎呀（Oh ～）');
    // 已出过的题重新渲染也遮
    const issued = issueQuestion(db, { id, word_id: 1, mode: 'recognize', state: 2 }, T, 'study', () => .5, 'listen_choice')!;
    const again = issueQuestion(db, { id, word_id: 1, mode: 'recognize', state: 2 }, T, 'study', () => .5)!;
    expect(again.id).toBe(issued.id); expect(again.options.find(o => o.wordId === 1)!.text).toBe('interj. 哎呀（Oh ～）');
    db.close();
  });
  it('(e) near-synonym / containment overlap excludes miss (小姐) from Ms (女士) questions', () => {
    expect(meaningsOverlap('n. 女士（用于姓名前，不表明婚否）', 'n. 失误, 避免, 失败, 小姐')).toBe(true);
    expect(meaningsOverlap('n. 女士', 'n. 女士们')).toBe(true);
    expect(meaningsOverlap('n. 女士', 'n. 博物馆')).toBe(false);
    const db = database(12); const id = card(db);
    db.prepare("UPDATE words SET headword='Ms (AmE Ms.)',meaning_zh='n. 女士（用于姓名前，不表明婚否）' WHERE id=1").run();
    for (const [h, m] of [['miss', 'n. 失误, 避免, 失败, 小姐'], ['madam', 'n. 女士, 夫人'], ['Mrs (AmE Mrs.)', 'n. 太太']]) db.prepare("INSERT INTO words(headword,meaning_zh,source) VALUES (?,?,'kb2022')").run(h, m);
    for (let seed = 0; seed < 20; seed++) for (const qtype of ['meaning_choice', 'listen_choice'] as const) {
      const q = buildQuestion(db, { id, word_id: 1, mode: 'recognize', state: 2 }, qtype, () => (seed * 37 % 100) / 100)!;
      expect(q.options.some(o => o.wordId > 12)).toBe(false);
    }
    db.close();
  });
});
