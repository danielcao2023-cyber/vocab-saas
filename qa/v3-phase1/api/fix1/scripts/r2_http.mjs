// 复测1：真实 HTTP（127.0.0.1:18425），DB 只读旁观
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
const require = createRequire('/workspace/vocab-saas/wt-v3/package.json');
const Database = require('better-sqlite3');
const BASE = 'http://127.0.0.1:18425';
const db = new Database(process.argv[2], { readonly: true });
const req = async (method, path, body) => { const r = await fetch(BASE + path, { method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json() }; };
const q1 = (s, ...a) => db.prepare(s).get(...a), qa = (s, ...a) => db.prepare(s).all(...a);
const sh = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const H = () => Object.fromEntries(['cards', 'review_logs', 'question_issues', 'wrong_words'].map(t => [t, sh(JSON.stringify(qa(`SELECT * FROM ${t} ORDER BY rowid`)))]));
const uid = () => crypto.randomUUID();
const log = (k, v) => console.log(k, JSON.stringify(v));
const norm = q => q && JSON.stringify({ qtype: q.qtype, prompt: q.prompt ?? null, options: q.options.map(o => [o.wordId, o.text]) });
const TODAY0 = new Date(Date.parse(new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10) + 'T00:00:00+08:00')).toISOString();
const ansOf = id => q1('SELECT answer_word_id a FROM question_issues WHERE id=?', id).a;
const strk = async () => { const s = (await req('GET', '/api/streak')).body; return { todayDone: s.todayDone, makeupLeft: s.makeupLeft, cands: s.makeupCandidates, blocked: s.makeupBlocked }; };

log('S0.streak', await strk());
// E: 先发练错词题（不答）
const pr0 = (await req('GET', '/api/wrong/practice')).body;
const pendingPractice = pr0.items.filter(i => i.question && i.card.mode === 'recognize').map(i => ({ cardId: i.card.id, hw: i.card.headword, qtype: i.question.qtype, qid: i.question.id, dueNow: i.card.due <= new Date().toISOString(), q: i.question }));
log('E0.practiceIssuedUnanswered', pendingPractice.map(p => ({ hw: p.hw, cardId: p.cardId, qtype: p.qtype, dueNow: p.dueNow })));

// 非错词本的词：找一张今天没有待答题、词不在错词本的卡
const notBook = q1(`SELECT c.id, c.mode, w.headword FROM cards c JOIN words w ON w.id=c.word_id WHERE c.mode='recognize' AND c.state<>0 AND c.word_id NOT IN (SELECT word_id FROM wrong_words) AND c.id NOT IN (SELECT card_id FROM question_issues WHERE answered_at IS NULL) LIMIT 1`);
const notBookSpell = q1(`SELECT c.id, w.headword FROM cards c JOIN words w ON w.id=c.word_id WHERE c.mode='spell' AND c.word_id NOT IN (SELECT word_id FROM wrong_words) LIMIT 1`);
{ const h0 = H(); const a = await req('POST', '/api/review', { cardId: notBook.id, rating: 3, answerId: uid(), context: 'practice' }); const b = await req('POST', '/api/check', { cardId: notBookSpell.id, answer: notBookSpell.headword, answerId: uid(), context: 'practice' }); log('V3.notInBookPractice', { review: { hw: notBook.headword, ...a }, check: { hw: notBookSpell.headword, ...b }, unchanged: JSON.stringify(h0) === JSON.stringify(H()) }); }
// 早于今天移出的词
const oldRemoved = q1(`SELECT c.id, w.headword, ww.removed_at FROM wrong_words ww JOIN cards c ON c.word_id=ww.word_id AND c.mode='recognize' JOIN words w ON w.id=ww.word_id WHERE ww.removed_at IS NOT NULL AND ww.removed_at < ? AND c.id NOT IN (SELECT card_id FROM question_issues WHERE answered_at IS NULL) LIMIT 1`, TODAY0);
if (oldRemoved) log('V5.removedBeforeToday', { ...oldRemoved, resp: await req('POST', '/api/review', { cardId: oldRemoved.id, rating: 3, answerId: uid(), context: 'practice' }) }); else log('V5.removedBeforeToday', 'none in DB');

let bypassDone = false, spellZ = false, spellNear = false, n = 0; const statuses = {}; const otherCtx = [];
while (n++ < 400) {
  const r = (await req('GET', '/api/next')).body; if (!r.card) break;
  const c = r.card, q = r.question;
  const pp = pendingPractice.find(p => p.cardId === c.id);
  if (pp) {
    const r2 = (await req('GET', '/api/next')).body, r3 = (await req('GET', '/api/next')).body;
    const iss = q ? q1('SELECT context,qtype FROM question_issues WHERE id=?', q.id) : null;
    otherCtx.push({ hw: c.headword, practiceQtype: pp.qtype, studyQ: q ? { id: q.id, qtype: q.qtype, ctx: iss.context, sameIdAsPractice: q.id === pp.qid } : null, refreshSame: !!q && norm(r2.question) === norm(q) && norm(r3.question) === norm(q) && r2.question.id === q.id && r3.question.id === q.id });
  }
  if (q && !bypassDone) {
    bypassDone = true;
    const h0 = H();
    const a = await req('POST', '/api/review', { cardId: c.id, rating: 4, answerId: uid(), context: 'practice' });
    const h1 = H();
    const b = await req('POST', '/api/review', { cardId: c.id, rating: 4, answerId: uid() });
    const inBook = !!q1('SELECT 1 FROM wrong_words WHERE word_id=? AND removed_at IS NULL', c.word_id);
    const spellCard = q1("SELECT id FROM cards WHERE word_id=? AND mode='spell'", c.word_id);
    const chk = await req('POST', '/api/check', { cardId: c.id, answer: c.headword, answerId: uid(), context: 'practice' });
    const chkSpell = spellCard ? await req('POST', '/api/check', { cardId: spellCard.id, answer: c.headword, answerId: uid(), context: 'practice' }) : 'no spell card';
    const h2 = H();
    log('M1.originalBypass', { hw: c.headword, cardState: c.state, qtype: q.qtype, wordInBook: inBook, practiceReview: a, unchangedAfterPractice: JSON.stringify(h0) === JSON.stringify(h1), studyReview: b, checkPracticeOnRecognizeCard: chk, checkPracticeOnSpellCardSameWord: chkSpell, unchangedAll: JSON.stringify(h0) === JSON.stringify(h2), questionStillOpen: q1('SELECT answered_at FROM question_issues WHERE id=?', q.id).answered_at === null });
    const ok = await req('POST', '/api/answer', { questionId: q.id, choiceWordId: ansOf(q.id), answerId: uid() });
    log('M1.normalStudyChoice', { status: ok.status, correct: ok.body.correct });
    statuses.answer = [...(statuses.answer ?? []), ok.status];
    continue;
  }
  let res, kind;
  if (q) { kind = 'answer'; res = await req('POST', '/api/answer', { questionId: q.id, choiceWordId: ansOf(q.id), answerId: uid() }); }
  else if (c.mode === 'recognize') { kind = 'flip'; res = await req('POST', '/api/review', { cardId: c.id, rating: 3, answerId: uid() }); }
  else {
    kind = 'check'; const right = c.headword.split(/[ (（/]/)[0];
    let ans = right;
    if (!spellZ && right.length >= 5) { spellZ = true; ans = 'zzz'; }
    else if (spellZ && !spellNear && right.length >= 5) { spellNear = true; ans = right.slice(0, -1) + (right.at(-1) === 'x' ? 'y' : 'x'); }
    res = await req('POST', '/api/check', { cardId: c.id, answer: ans, answerId: uid() });
    if (ans !== right) log('S.spell', { headword: c.headword, typed: ans, resp: res });
  }
  (statuses[kind] ??= []).push(res.status);
}
log('M1.studyLoop', { served: n - 1, statusCounts: Object.fromEntries(Object.entries(statuses).map(([k, v]) => [k, v.reduce((m, s) => (m[s] = (m[s] ?? 0) + 1, m), {})])) });
log('E1.otherContextPending', otherCtx);
log('S1.streakAfterComplete', await strk());
log('S1.today', (await req('GET', '/api/today')).body.completed);

// 先把之前未答的练习题答掉
const prAns = [];
for (const p of pendingPractice) { const r = await req('POST', '/api/answer', { questionId: p.qid, choiceWordId: ansOf(p.qid), answerId: uid() }); prAns.push({ hw: p.hw, status: r.status, err: r.body.error }); }
log('E2.answerEarlierPracticeQs', prAns);
// 完整 10 题练错词
const pr = (await req('GET', '/api/wrong/practice')).body; const res = [];
for (const it of pr.items) {
  const c = it.card, q = it.question; const aid = uid(); let r;
  if (q) r = await req('POST', '/api/answer', { questionId: q.id, choiceWordId: ansOf(q.id), answerId: aid });
  else if (c.mode === 'recognize') r = await req('POST', '/api/review', { cardId: c.id, rating: 3, answerId: aid, context: 'practice' });
  else r = await req('POST', '/api/check', { cardId: c.id, answer: c.headword.split(/[ (（/]/)[0], answerId: aid, context: 'practice' });
  const lg = q1('SELECT counted,context,qtype FROM review_logs WHERE answer_id=?', aid);
  res.push({ hw: c.headword, qtype: q?.qtype ?? c.mode, status: r.status, err: r.body.error, log: lg });
}
log('M1.practice10', { n: res.length, all200: res.every(r => r.status === 200), res });
// 今天移出的词仍可练
const bw = q1(`SELECT ww.word_id, w.headword, c.id cid FROM wrong_words ww JOIN words w ON w.id=ww.word_id JOIN cards c ON c.word_id=ww.word_id AND c.mode='recognize' WHERE ww.removed_at IS NULL AND c.id NOT IN (SELECT card_id FROM question_issues WHERE answered_at IS NULL) LIMIT 1`);
await req('POST', `/api/wrong/${bw.word_id}`, { inBook: false });
const rt = await req('POST', '/api/review', { cardId: bw.cid, rating: 3, answerId: uid(), context: 'practice' });
log('V4.removedTodayPractice', { hw: bw.headword, removed_at: q1('SELECT removed_at FROM wrong_words WHERE word_id=?', bw.word_id).removed_at, resp: rt });
// 补签用完前后
const st = await strk(); log('S2.beforeMakeup', st);
for (const d of st.cands.slice(0, 3)) log(`S2.makeup ${d}`, (r => ({ status: r.status, err: r.body.error }))(await req('POST', '/api/streak/makeup', { day: d })));
log('S3.afterUsedUp', await strk());
