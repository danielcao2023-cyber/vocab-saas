// 独立验收：对 127.0.0.1:18425 真实 HTTP 接口跑规则检查；DB 只读旁观
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import fs from 'node:fs';
const require = createRequire('/workspace/vocab-saas/wt-v3/package.json');
const Database = require('better-sqlite3');
const BASE = 'http://127.0.0.1:18425';
const DBF = '/workspace/vocab-saas/qa/v3-phase1/api/db/api-18425.db';
const db = new Database(DBF, { readonly: true });
const out = []; const log = (k, v) => { out.push({ k, v }); console.log(k, typeof v === 'string' ? v : JSON.stringify(v)); };
const req = async (method, path, body) => { const r = await fetch(BASE + path, { method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined }); let j; const t = await r.text(); try { j = JSON.parse(t); } catch { j = t; } return { status: r.status, body: j }; };
const q1 = (s, ...a) => db.prepare(s).get(...a);
const qa = (s, ...a) => db.prepare(s).all(...a);
const sh = s => crypto.createHash('sha256').update(s).digest('hex');
const tableHashes = () => Object.fromEntries(qa("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").map(r => r.name).map(t => [t, sh(JSON.stringify(qa(`SELECT * FROM "${t}" ORDER BY rowid`)))]));
const uid = () => crypto.randomUUID();

log('start', new Date().toISOString());
log('C1.today0', (await req('GET', '/api/today')).body);
const st0 = (await req('GET', '/api/streak')).body; log('C1.streak0', { current: st0.current, best: st0.best, makeupLeft: st0.makeupLeft, cands: st0.makeupCandidates, cal: st0.calendar.filter(d => d.day >= '2026-10-01' && d.day <= '2026-10-18').map(d => d.day.slice(8) + ':' + d.status).join(' ') });
log('C5.makeupBeforeToday(10-16)', await req('POST', '/api/streak/makeup', { day: '2026-10-16' }));

// C2 study loop
const questions = []; let firstQ = true; let n = 0; const newWithChoice = []; const counts = { flip: 0, listen_choice: 0, meaning_choice: 0, spell: 0, dictation: 0 };
const checks = { refreshSame: 0, refreshDiff: 0 };
while (n < 400) {
  const r = (await req('GET', '/api/next')).body; if (!r.card) break; n++;
  const c = r.card, q = r.question;
  if (q) {
    if (c.state === 0) newWithChoice.push(c.id);
    const r2 = (await req('GET', '/api/next')).body;
    const same = r2.card?.id === c.id && JSON.stringify(r2.question) === JSON.stringify(q); same ? checks.refreshSame++ : checks.refreshDiff++;
    counts[q.qtype]++;
    const ans = q1('SELECT answer_word_id FROM question_issues WHERE id=?', q.id).answer_word_id;
    questions.push({ card: c, q, answerWordId: ans });
    if (firstQ) {
      firstQ = false;
      const rv = await req('POST', '/api/review', { cardId: c.id, rating: 3, answerId: uid() });
      log('C2.reviewWhileChoicePending', rv);
      const rvP = { note: 'context=practice bypass probe deferred' };
      const wrong = q.options.find(o => o.wordId !== ans).wordId;
      const ww0 = q1('SELECT * FROM wrong_words WHERE word_id=?', c.word_id) ?? null;
      const logs0 = q1('SELECT COUNT(*) n FROM review_logs').n;
      const aid = uid();
      const a1 = await req('POST', '/api/answer', { questionId: q.id, choiceWordId: wrong, answerId: aid, durationMs: 4000 });
      const lg = q1('SELECT rating,correct,qtype,context,counted,answer,answer_id FROM review_logs ORDER BY id DESC LIMIT 1');
      const ww1 = q1('SELECT * FROM wrong_words WHERE word_id=?', c.word_id);
      log('C2.wrongAnswer', { headword: c.headword, state: c.state, resp: a1, log: lg, wrongBefore: ww0, wrongAfter: ww1, logsDelta: q1('SELECT COUNT(*) n FROM review_logs').n - logs0 });
      const a2 = await req('POST', '/api/answer', { questionId: q.id, choiceWordId: ans, answerId: aid });
      log('C2.duplicateSameAnswerId', { status: a2.status, duplicate: a2.body.duplicate, correct: a2.body.correct, logsDelta: q1('SELECT COUNT(*) n FROM review_logs').n - logs0 });
      const a3 = await req('POST', '/api/answer', { questionId: q.id, choiceWordId: ans, answerId: uid() });
      log('C2.differentAnswerId', { status: a3.status, body: a3.body, logsDelta: q1('SELECT COUNT(*) n FROM review_logs').n - logs0 });
      continue;
    }
    const aid = uid();
    const a = await req('POST', '/api/answer', { questionId: q.id, choiceWordId: ans, answerId: aid, durationMs: 3000 });
    const lg = q1('SELECT rating,correct,qtype,context,counted FROM review_logs WHERE answer_id=?', aid);
    if (questions.length === 2) log('C2.rightAnswer', { headword: c.headword, resp: { status: a.status, correct: a.body.correct }, log: lg });
    if (!a.body.correct || lg.rating !== 3) log('C2.UNEXPECTED_right', { a, lg });
  } else if (c.mode === 'recognize') {
    counts.flip++;
    await req('POST', '/api/review', { cardId: c.id, rating: 3, answerId: uid(), durationMs: 3000 });
  } else {
    counts[c.mode]++;
    const ans = c.headword.split(/[ (（]/)[0];
    const k = await req('POST', '/api/check', { cardId: c.id, answer: ans, answerId: uid(), durationMs: 3000 });
    if (!k.body.correct) log('C2.spellWrongBySimpleAnswer', { headword: c.headword, sent: ans });
  }
}
log('C2.loop', { cardsServed: n, counts, newCardsWithChoice: newWithChoice, refresh: checks });
log('C2.todayAfter', (await req('GET', '/api/today')).body);
log('C2.dailyStatsToday', q1("SELECT * FROM daily_stats WHERE day='2026-10-17'"));
fs.writeFileSync('/workspace/vocab-saas/qa/v3-phase1/api/C2_questions.json', JSON.stringify(questions.map(x => ({ headword: x.card.headword, state: x.card.state, qtype: x.q.qtype, prompt: x.q.prompt, answerWordId: x.answerWordId, options: x.q.options })), null, 1));

// C5 makeup after completion
const st1 = (await req('GET', '/api/streak')).body; log('C5.streakAfterComplete', { current: st1.current, best: st1.best, makeupLeft: st1.makeupLeft, cands: st1.makeupCandidates, cal: st1.calendar.filter(d => d.day >= '2026-10-01' && d.day <= '2026-10-18').map(d => d.day.slice(8) + ':' + d.status).join(' ') });
for (const d of ['2026-10-09', '2026-10-08', '2026-10-17', '2026-10-18', '2026-09-30']) log(`C5.makeup(${d})`, await req('POST', '/api/streak/makeup', { day: d }));
for (const d of st1.makeupCandidates) log(`C5.makeup(${d})`, (r => ({ status: r.status, error: r.body.error, current: r.body.current, makeupLeft: r.body.makeupLeft }))(await req('POST', '/api/streak/makeup', { day: d })));
log('C5.makeupsTable', qa('SELECT * FROM streak_makeups'));

// C3 practice
const before = { cards: sh(JSON.stringify(qa('SELECT * FROM cards ORDER BY id'))), reviewed: q1("SELECT COUNT(*) n FROM review_logs WHERE state<>0 AND COALESCE(counted,1)<>0 AND review_at>=?", '2026-10-16T16:00:00.000Z').n };
const todayBefore = (await req('GET', '/api/today')).body;
const pr = (await req('GET', '/api/wrong/practice')).body;
const results = [];
for (const it of pr.items) {
  const c = it.card, q = it.question; const aid = uid(); let resp;
  const cardBefore = q1('SELECT * FROM cards WHERE id=?', c.id);
  if (q) { const ans = q1('SELECT answer_word_id FROM question_issues WHERE id=?', q.id).answer_word_id; resp = await req('POST', '/api/answer', { questionId: q.id, choiceWordId: ans, answerId: aid }); }
  else if (c.mode === 'recognize') resp = await req('POST', '/api/review', { cardId: c.id, rating: 3, answerId: aid, context: 'practice' });
  else resp = await req('POST', '/api/check', { cardId: c.id, answer: c.headword.split(/[ (（]/)[0], answerId: aid, context: 'practice' });
  const lg = q1('SELECT counted,context,qtype,rating FROM review_logs WHERE answer_id=?', aid);
  const cardAfter = q1('SELECT * FROM cards WHERE id=?', c.id);
  results.push({ hw: c.headword, mode: c.mode, qtype: q?.qtype ?? (c.mode === 'recognize' ? 'flip' : c.mode), status: resp.status, log: lg, cardUnchanged: JSON.stringify(cardBefore) === JSON.stringify(cardAfter), studiedTodayBefore: !!q1('SELECT 1 FROM review_logs WHERE card_id=? AND COALESCE(counted,1)<>0 AND review_at>=? AND id<(SELECT id FROM review_logs WHERE answer_id=?)', c.id, '2026-10-16T16:00:00.000Z', aid) });
}
log('C3.practice1', results);
// second practice round
const pr2 = (await req('GET', '/api/wrong/practice')).body; const res2 = [];
for (const it of pr2.items) {
  const c = it.card, q = it.question; const aid = uid(); let resp;
  const cardBefore = q1('SELECT * FROM cards WHERE id=?', c.id);
  if (q) { const ans = q1('SELECT answer_word_id FROM question_issues WHERE id=?', q.id).answer_word_id; resp = await req('POST', '/api/answer', { questionId: q.id, choiceWordId: ans, answerId: aid }); }
  else if (c.mode === 'recognize') resp = await req('POST', '/api/review', { cardId: c.id, rating: 3, answerId: aid, context: 'practice' });
  else resp = await req('POST', '/api/check', { cardId: c.id, answer: c.headword.split(/[ (（]/)[0], answerId: aid, context: 'practice' });
  const lg = q1('SELECT counted,context,qtype,rating FROM review_logs WHERE answer_id=?', aid);
  res2.push({ hw: c.headword, qtype: q?.qtype ?? (c.mode === 'recognize' ? 'flip' : c.mode), status: resp.status, counted: lg?.counted, cardUnchanged: JSON.stringify(cardBefore) === JSON.stringify(q1('SELECT * FROM cards WHERE id=?', c.id)) });
}
log('C3.practice2', res2);
log('C3.reviewedTodayBeforeAfter', { before: before.reviewed, after: q1("SELECT COUNT(*) n FROM review_logs WHERE state<>0 AND COALESCE(counted,1)<>0 AND review_at>=?", '2026-10-16T16:00:00.000Z').n });
log('C3.todayBeforeAfterPractice', { before: todayBefore, after: (await req('GET', '/api/today')).body });

// C6 put-back
const wl = (await req('GET', '/api/wrong')).body; const w = wl.items[0];
log('C6.wrongListTop', { total: wl.total, practicedTwiceThisWeek: wl.practicedTwiceThisWeek, first: { hw: w.headword, wrong_count: w.wrong_count, correct_days: w.correct_days, fails: w.fails } });
const r0 = q1('SELECT * FROM wrong_words WHERE word_id=?', w.word_id);
await req('POST', `/api/wrong/${w.word_id}`, { inBook: false }); const r1 = q1('SELECT * FROM wrong_words WHERE word_id=?', w.word_id);
await req('POST', `/api/wrong/${w.word_id}`, { inBook: true }); const r2 = q1('SELECT * FROM wrong_words WHERE word_id=?', w.word_id);
log('C6.removeThenPutBack', { before: r0, removed: r1, putBack: r2 });

// C7 parent read-only
const h0 = tableHashes(); const ds0 = qa('SELECT * FROM daily_stats ORDER BY day');
const ps = await req('GET', '/api/parent/summary?days=30');
const h1 = tableHashes(); const ds1 = qa('SELECT * FROM daily_stats ORDER BY day');
const changedTables = Object.keys(h0).filter(t => h0[t] !== h1[t]);
const changedDays = ds1.filter((r, i) => JSON.stringify(r) !== JSON.stringify(ds0[i])).map(r => r.day);
log('C7.parent', { status: ps.status, keys: Object.keys(ps.body), wrongTop20Len: ps.body.wrongTop20?.length, progress: ps.body.progress, streak: ps.body.streak, changedTables, changedDays });
const ps2 = await req('GET', '/api/parent/summary?days=30'); const h2 = tableHashes();
log('C7.parentSecondCall', { changedTables: Object.keys(h1).filter(t => h1[t] !== h2[t]) });
for (const p of ['/parent', '/']) { const r = await fetch(BASE + p); log(`C7.page${p}`, { status: r.status, len: (await r.text()).length }); }
log('C7.parentBadDays', (await req('GET', '/api/parent/summary?days=0')).status);

// C8 practice-context bypass probe on a study choice question
log('end', new Date().toISOString());
fs.writeFileSync('/workspace/vocab-saas/qa/v3-phase1/api/C_http_results.json', JSON.stringify(out, null, 1));
