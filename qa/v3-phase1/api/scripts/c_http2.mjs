// 第二轮（新副本）：刷新不变题（按字段比较）+ context=practice 绕过探测
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
const require = createRequire('/workspace/vocab-saas/wt-v3/package.json');
const Database = require('better-sqlite3');
const BASE = 'http://127.0.0.1:18425';
const db = new Database('/workspace/vocab-saas/qa/v3-phase1/api/db/api-18425b.db', { readonly: true });
const req = async (method, path, body) => { const r = await fetch(BASE + path, { method, headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json() }; };
const norm = q => q && JSON.stringify({ id: q.id, qtype: q.qtype, prompt: q.prompt ?? null, options: q.options.map(o => [o.wordId, o.text]) });
const uid = () => crypto.randomUUID();
let same = 0, diff = 0, probed = false, n = 0; const diffs = [];
while (n++ < 400) {
  const r = (await req('GET', '/api/next')).body; if (!r.card) break;
  const c = r.card, q = r.question;
  if (q) {
    const r2 = (await req('GET', '/api/next')).body; const r3 = (await req('GET', '/api/next')).body;
    (r2.card.id === c.id && norm(r2.question) === norm(q) && norm(r3.question) === norm(q)) ? same++ : (diff++, diffs.push({ a: norm(q), b: norm(r2.question) }));
    if (!probed) {
      probed = true;
      const before = db.prepare('SELECT * FROM cards WHERE id=?').get(c.id);
      const study = await req('POST', '/api/review', { cardId: c.id, rating: 4, answerId: uid() });
      const aid = uid();
      const prac = await req('POST', '/api/review', { cardId: c.id, rating: 4, answerId: aid, context: 'practice' });
      const lg = db.prepare('SELECT rating,counted,context,qtype FROM review_logs WHERE answer_id=?').get(aid);
      const after = db.prepare('SELECT * FROM cards WHERE id=?').get(c.id);
      const open = db.prepare('SELECT answered_at FROM question_issues WHERE id=?').get(q.id);
      console.log('PROBE', JSON.stringify({ headword: c.headword, qtype: q.qtype, studyReview: study, practiceReview: prac, log: lg, cardBefore: { due: before.due, state: before.state, reps: before.reps }, cardAfter: { due: after.due, state: after.state, reps: after.reps }, questionStillOpen: open }));
      const nx = (await req('GET', '/api/next')).body; console.log('NEXT_AFTER_PROBE', nx.card?.id === c.id, nx.card?.headword);
      continue;
    }
    const ans = db.prepare('SELECT answer_word_id FROM question_issues WHERE id=?').get(q.id).answer_word_id;
    await req('POST', '/api/answer', { questionId: q.id, choiceWordId: ans, answerId: uid() });
  } else if (c.mode === 'recognize') await req('POST', '/api/review', { cardId: c.id, rating: 3, answerId: uid() });
  else await req('POST', '/api/check', { cardId: c.id, answer: c.headword.split(/[ (（]/)[0], answerId: uid() });
}
console.log('REFRESH', JSON.stringify({ same, diff, diffs: diffs.slice(0, 3) }));
