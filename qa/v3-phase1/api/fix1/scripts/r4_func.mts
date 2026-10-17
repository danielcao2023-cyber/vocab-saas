import fs from 'node:fs';
import crypto from 'node:crypto';
const W = '/workspace/vocab-saas/wt-v3/server/src/';
const { openDb } = await import(W + 'db.ts');
const { buildApp } = await import(W + 'app.ts');
const { buildQuestion, meaningSet, meaningsOverlap, issueQuestion, editDistance } = await import(W + 'quiz.ts');
const { maskAnswer, answerForms } = await import(W + 'text.ts');
const { isNearMiss } = await import('/workspace/vocab-saas/wt-v3/web/src/diff.ts');
const D = '/workspace/vocab-saas/qa/v3-phase1/api/fix1/db/';
const which = process.argv[2]; const R: any = {};
const copy = (name: string) => { fs.copyFileSync(D + 'pristine.db', D + name); for (const s of ['-wal','-shm']) fs.rmSync(D + name + s, { force: true }); return openDb(D + name); };
function seeded(seed = 42) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; }; }
const uid = () => crypto.randomUUID();
if (which === 'scan') {
  const db = copy('scan.db');
  const words = db.prepare("SELECT * FROM words WHERE source='kb2022' ORDER BY id").all() as any[];
  const byId = new Map(words.map(w => [w.id, w]));
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const has = (t: string, h: string) => new RegExp(`(^|[^A-Za-z])${esc(h).replace(/'/g, "['’‘ʼ]")}(?![A-Za-z])`, 'i').test(t);
  const stats: any = { listen_choice: { built: 0, fallback: 0 }, meaning_choice: { built: 0, fallback: 0 } };
  const viol: any[] = []; const leakExact: any[] = []; const leakForm: any[] = []; const near: any[] = []; const overMask: any[] = []; const changed: any[] = []; const msOpts: any[] = [];
  const rng = seeded(7);
  for (const w of words) for (const qt of ['listen_choice', 'meaning_choice'] as const) {
    const q = buildQuestion(db, { id: 0, word_id: w.id, mode: 'recognize', state: 2 }, qt, rng);
    if (!q) { stats[qt].fallback++; continue; } stats[qt].built++;
    const ids = q.options.map((o: any) => o.wordId);
    const hs = ids.map((i: number) => byId.get(i).headword.toLowerCase().replace(/\(.*?\)|（.*?）/g, '').trim());
    let synOld = false, synNew = false;
    for (let a = 0; a < 4; a++) for (let b = 0; b < a; b++) { const A = meaningSet(byId.get(ids[a]).meaning_zh), B = meaningSet(byId.get(ids[b]).meaning_zh); if ([...A].some(s => B.has(s))) synOld = true; if (meaningsOverlap(byId.get(ids[a]).meaning_zh, byId.get(ids[b]).meaning_zh)) synNew = true; }
    const v = { len: ids.length !== 4, dupId: new Set(ids).size !== 4, oneCorrect: ids.filter((i: number) => i === w.id).length !== 1, dupText: new Set(q.options.map((o: any) => o.text.replace(/\s/g, '').toLowerCase())).size !== 4, caseVariant: new Set(hs).size !== 4, synOld, synNew };
    if (Object.values(v).some(Boolean)) viol.push({ hw: w.headword, qt, v });
    if (/^Ms\b/.test(w.headword)) msOpts.push({ qt, options: hs });
    const texts: { t: string; raw: string }[] = qt === 'meaning_choice' ? [{ t: q.prompt, raw: w.meaning_source === 'manual' ? w.meaning_zh : w.meaning_zh.split('\n').slice(0, 2).join('\n') }] : q.options.map((o: any) => ({ t: o.text, raw: byId.get(o.wordId).meaning_zh.split('\n').map((x: string) => x.trim()).filter(Boolean)[0] }));
    for (const { t, raw } of texts) {
      for (const h of answerForms(w.headword)) if (has(t, h)) leakExact.push({ hw: w.headword, qt, h, t });
      const m = t.match(/(^|[^A-Za-z])([A-Za-z][A-Za-z'-]*)\s*的\s*(过去式|过去分词|现在分词|复数|比较级|最高级|第三人称)/); if (m && m[2] !== '某词') leakForm.push({ hw: w.headword, qt, t });
      // 近形英文词（前缀≥3且编辑距离≤3）
      const main = answerForms(w.headword)[0]?.toLowerCase() ?? '';
      for (const tok of t.match(/[A-Za-z][A-Za-z'-]+/g) ?? []) { const k = tok.toLowerCase(); if (main.length >= 3 && k !== main && k.slice(0, 3) === main.slice(0, 3) && editDistance(k, main) <= 3) near.push({ hw: w.headword, qt, tok, t }); }
      if (t !== raw) { changed.push({ hw: w.headword, qt, raw, t }); const cjk = (t.match(/[\u4e00-\u9fff]/g) ?? []).length; if (cjk < 2 || (t.match(/～|某词/g) ?? []).length * 2 > cjk) overMask.push({ hw: w.headword, qt, raw, t }); }
    }
  }
  R.stats = stats; R.violations = viol.length; R.violEx = viol.slice(0, 10); R.leakExact = leakExact.length; R.leakExactEx = leakExact.slice(0, 10); R.leakForm = leakForm; R.nearFormCandidates = near.length; R.nearEx = near.slice(0, 40);
  R.maskedTexts = changed.length; R.overMask = overMask; R.msOptions = msOpts;
  const r2 = seeded(3); R.maskedSample10 = Array.from({ length: 10 }, () => changed[Math.floor(r2() * changed.length)]);
  R.allChangedHeadwords = [...new Set(changed.map(c => c.hw))];
  R.nearMiss = Object.fromEntries([['zzz','could'],['reallx','really'],['could','could'],['coud','could'],['cuold','could'],['xyz','receive'],['recieve','receive'],['recive','receive'],['recxxve','receive'],['ab','an'],['o’clok',"o'clock"]].map(([t,e]) => [`${t}→${e}`, isNearMiss(t, e)]));
  db.close();
}
if (which === 'otherctx') {
  // 另一个 context 有待答题：注入时间 + 直接调 issueQuestion / inject
  const db = copy('otherctx.db'); const now = new Date('2026-10-17T02:00:00Z');
  const app = buildApp(db, { now: () => now, rng: seeded(5) });
  const out: any[] = [];
  // 情形 A：study 先出题，再从 practice 出（forced flip）
  let n: any; for (let i = 0; i < 200; i++) { n = (await app.inject('/api/next')).json(); if (n.question) break; if (n.card.mode === 'recognize') await app.inject({ method: 'POST', url: '/api/review', payload: { cardId: n.card.id, rating: 3, answerId: uid() } }); else await app.inject({ method: 'POST', url: '/api/check', payload: { cardId: n.card.id, answer: n.card.headword, answerId: uid() } }); }
  const p = issueQuestion(db, n.card, now, 'practice', seeded(1), 'flip');
  const pIss = p ? db.prepare('SELECT context,qtype FROM question_issues WHERE id=?').get(p.id) : null;
  const again = (await app.inject('/api/next')).json();
  out.push({ case: 'A study-open then practice(forced flip)', hw: n.card.headword, studyQ: { id: n.question.id, qtype: n.question.qtype }, practiceQ: p && { id: p.id, qtype: p.qtype, issue: pIss }, studyRefreshSameId: again.question?.id === n.question.id && JSON.stringify(again.question.options) === JSON.stringify(n.question.options) });
  // 两题都答
  const ans = (id: number) => (db.prepare('SELECT answer_word_id a FROM question_issues WHERE id=?').get(id) as any).a;
  const s1 = await app.inject({ method: 'POST', url: '/api/answer', payload: { questionId: n.question.id, choiceWordId: ans(n.question.id), answerId: uid() } });
  const s2 = p ? await app.inject({ method: 'POST', url: '/api/answer', payload: { questionId: p.id, choiceWordId: ans(p.id), answerId: uid() } }) : null;
  out.push({ answerStudy: s1.statusCode, answerPractice: s2?.statusCode, practiceLog: db.prepare('SELECT counted,context,qtype FROM review_logs ORDER BY id DESC LIMIT 1').get() });
  // 情形 B：practice 先出题（对一张今天到期、尚未出题的认词卡），再 study /api/next
  const due = db.prepare("SELECT c.* FROM cards c WHERE c.mode='recognize' AND c.state<>0 AND c.due<=? AND c.id NOT IN (SELECT card_id FROM question_issues) ORDER BY c.due LIMIT 1").get(now.toISOString()) as any;
  const pq = issueQuestion(db, due, now, 'practice', seeded(9), 'listen_choice');
  let hit: any = null; for (let i = 0; i < 200; i++) { const x = (await app.inject('/api/next')).json(); if (!x.card) break; if (x.card.id === due.id) { hit = x; break; } if (x.question) await app.inject({ method: 'POST', url: '/api/answer', payload: { questionId: x.question.id, choiceWordId: ans(x.question.id), answerId: uid() } }); else if (x.card.mode === 'recognize') await app.inject({ method: 'POST', url: '/api/review', payload: { cardId: x.card.id, rating: 3, answerId: uid() } }); else await app.inject({ method: 'POST', url: '/api/check', payload: { cardId: x.card.id, answer: x.card.headword, answerId: uid() } }); }
  const r2 = (await app.inject('/api/next')).json(), r3 = (await app.inject('/api/next')).json();
  const flipTry = hit ? await app.inject({ method: 'POST', url: '/api/review', payload: { cardId: due.id, rating: 3, answerId: uid() } }) : null;
  out.push({ case: 'B practice-open then study /api/next', cardId: due.id, practiceQ: pq && { id: pq.id, qtype: pq.qtype }, studyServed: hit && { qtype: hit.question?.qtype, id: hit.question?.id, ctx: hit.question && (db.prepare('SELECT context FROM question_issues WHERE id=?').get(hit.question.id) as any).context }, refreshSame: !!hit?.question && r2.question?.id === hit.question.id && r3.question?.id === hit.question.id && JSON.stringify(r2.question.options) === JSON.stringify(hit.question.options), flipReviewStatus: flipTry?.statusCode });
  R.otherctx = out; db.close();
}
console.log(JSON.stringify(R, null, 1));
