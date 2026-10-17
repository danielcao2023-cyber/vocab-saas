// 工程负责人补充：b4429a2 写入的旧日志里，ts-fsrs 的 log.due 对所有非 New 状态（学习、复习、重学）
// 都是上一次复习时间，而不是复习前的到期时间。用旧格式重写日志后，queueStateAt 必须仍与当时的 queueState 一致。
import { it, expect } from 'vitest';
import { State } from 'ts-fsrs';
import { nextCard, queueState, review } from '../server/src/study.ts';
import { queueStateAt, recomputeDailyStats } from '../server/src/stats.ts';
import { database, day, seeded } from './v3-helpers.ts';

it('reconstructs queues from legacy (b4429a2-format) logs in Review state too', () => {
  for (let seed = 1; seed <= 6; seed++) {
    const db = database(12), rng = seeded(seed); const checkpoints: { at: Date; q: unknown }[] = [];
    db.prepare("UPDATE settings SET value='4' WHERE key='new_per_day'").run();
    for (let d = 0; d < 14; d++) for (let j = 0; j < 14; j++) {
      const now = new Date(day(d).getTime() + j * 600_000);
      const c = nextCard(db, now);
      if (c) review(db, c.id, ([1, 2, 3, 3, 4] as const)[Math.floor(rng() * 5)], now);
      checkpoints.push({ at: now, q: queueState(db, now) });
    }
    // 改写成旧格式：qtype/counted/context 为空，due = ts-fsrs 旧 log.due（New 为卡片 due，其余为上一次复习时间）
    const logs = db.prepare('SELECT id,card_id,state,review_at FROM review_logs ORDER BY card_id,id').all() as { id: number; card_id: number; state: number; review_at: string }[];
    expect(logs.some(l => l.state === State.Review)).toBe(true);
    let prev: (typeof logs)[number] | undefined;
    for (const l of logs) {
      const p = prev && prev.card_id === l.card_id ? prev : undefined;
      db.prepare('UPDATE review_logs SET qtype=NULL,counted=NULL,context=NULL,due=COALESCE(?,due) WHERE id=?').run(l.state !== State.New && p ? p.review_at : null, l.id);
      prev = l;
    }
    db.exec('DELETE FROM daily_stats'); recomputeDailyStats(db);
    for (const p of checkpoints) expect(queueStateAt(db, p.at), `seed=${seed} at=${p.at.toISOString()}`).toEqual(p.q);
    db.close();
  }
});

it('POST /api/review is refused while the card has an open choice question (server-side judging)', async () => {
  const { buildApp } = await import('../server/src/app.ts');
  const db = database(16); const at = day(0);
  // 让一张认词卡进入 Review 状态，再强制出选择题
  db.prepare("UPDATE settings SET value='1,0,0' WHERE key='choice_weights'").run();
  const first = nextCard(db, at)!; review(db, first.id, 4, at);
  db.prepare("UPDATE settings SET value='0,0,1' WHERE key='choice_weights'").run();
  db.prepare('UPDATE cards SET due=? WHERE id=?').run(day(5).toISOString(), first.id);
  const app = buildApp(db, { now: () => day(5), rng: seeded(7) });
  const { issueQuestion } = await import('../server/src/quiz.ts');
  const row = db.prepare('SELECT * FROM cards WHERE id=?').get(first.id) as any;
  const q = issueQuestion(db, row, day(5), 'study', seeded(7))!;
  expect(q?.qtype).toBe('meaning_choice');
  const next = { question: q };
  const r = await app.inject({ method: 'POST', url: '/api/review', payload: { cardId: first.id, rating: 3, answerId: 'x1' } });
  expect(r.statusCode).toBe(409);
  const ok = await app.inject({ method: 'POST', url: '/api/answer', payload: { questionId: next.question.id, choiceWordId: next.question.options[0].wordId, answerId: 'x2' } });
  expect(ok.statusCode).toBe(200);
  db.close();
});
