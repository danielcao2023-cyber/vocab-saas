// 独立验收：函数级/注入时间检查（buildApp(db,{now}).inject 与直接调函数），全部在 DB 副本上
import fs from 'node:fs';
import crypto from 'node:crypto';
const W = '/workspace/vocab-saas/wt-v3/server/src/';
const { openDb } = await import(W + 'db.ts');
const { buildApp } = await import(W + 'app.ts');
const { buildQuestion, meaningSet } = await import(W + 'quiz.ts');
const { todaySummary, queueState } = await import(W + 'study.ts');
const { shDay } = await import(W + 'time.ts');
const D = process.env.FDIR ?? '/workspace/vocab-saas/qa/v3-phase1/api/db/';
const PR = D + (process.env.FDIR ? 'pristine.db' : 'api-18425.pristine.db');
const which = process.argv[2];
const R: any = {};
const copy = (name: string, src = PR) => { fs.copyFileSync(src, D + name); for (const s of ['-wal','-shm']) fs.rmSync(D + name + s, { force: true }); return openDb(D + name); };
function seeded(seed = 42) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; }; }
const uid = () => crypto.randomUUID();

if (which === 'distractors') {
  const db = copy('f-distr.db');
  const words = db.prepare("SELECT * FROM words WHERE source='kb2022' ORDER BY id").all() as any[];
  const byId = new Map(words.map(w => [w.id, w]));
  const mainHeads = (h: string) => h.replace(/[’‘]/g, "'").split(/\s*[(/（,，]\s*|\s*\)\s*/).map(x => x.trim()).filter(x => x.length > 1);
  const maskHeads = mainHeads; // 与 ChoiceQuestion.vue 的 heads 规则一致
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const mask = (text: string, hw: string) => maskHeads(hw).reduce((t, h) => t.replace(new RegExp(`(^|[^A-Za-z])${esc(h)}(?![A-Za-z])`, 'gi'), '$1～'), text);
  const exact = (text: string, hw: string) => mainHeads(hw).some(h => new RegExp(`(^|[^A-Za-z])${esc(h)}(?![A-Za-z])`, 'i').test(text));
  const stemLeak = (text: string, hw: string) => mainHeads(hw).some(h => h.length >= 3 && new RegExp(`(^|[^A-Za-z])${esc(h.slice(0, Math.max(3, h.length - 1)))}[a-z]*`, 'i').test(text));
  const stats: any = { listen_choice: { built: 0, fallback: 0 }, meaning_choice: { built: 0, fallback: 0 } };
  const violations: any[] = []; const leaks: any = { rawExact: [], afterMaskExact: [], afterMaskStemOnly: [], ownHeadInDistractorOption: [] };
  const rng = seeded(7);
  for (const w of words) for (const qtype of ['listen_choice', 'meaning_choice'] as const) {
    const q = buildQuestion(db, { id: 0, word_id: w.id, mode: 'recognize', state: 2 }, qtype, rng);
    if (!q) { stats[qtype].fallback++; continue; }
    stats[qtype].built++;
    const ids = q.options.map((o: any) => o.wordId);
    const hs = ids.map((i: number) => byId.get(i).headword.toLowerCase().replace(/\(.*?\)|（.*?）/g, '').trim());
    const texts = q.options.map((o: any) => o.text.replace(/\s/g, '').toLowerCase());
    const sets = ids.map((i: number) => meaningSet(byId.get(i).meaning_zh));
    let syn = false; for (let a = 0; a < 4; a++) for (let b = 0; b < a; b++) if ([...sets[a]].some(s => sets[b].has(s))) syn = true;
    const v = { len: q.options.length !== 4, dupId: new Set(ids).size !== 4, oneCorrect: ids.filter((i: number) => i === w.id).length !== 1, dupText: new Set(texts).size !== 4, caseVariant: new Set(hs).size !== 4, synonym: syn, otherSource: ids.some((i: number) => !byId.has(i)) };
    if (Object.values(v).some(Boolean)) violations.push({ hw: w.headword, qtype, v, options: q.options });
    const answerTexts = qtype === 'meaning_choice' ? [q.prompt] : q.options.map((o: any) => o.text);
    for (const t of answerTexts) {
      if (exact(t, w.headword)) { leaks.rawExact.push({ hw: w.headword, qtype, text: t }); if (exact(mask(t, w.headword), w.headword)) leaks.afterMaskExact.push({ hw: w.headword, qtype, text: mask(t, w.headword) }); }
      else if (stemLeak(t, w.headword)) leaks.afterMaskStemOnly.push({ hw: w.headword, qtype, text: t });
    }
    if (qtype === 'listen_choice') for (const o of q.options) if (o.wordId !== w.id && exact(o.text, byId.get(o.wordId).headword)) leaks.ownHeadInDistractorOption.push({ answer: w.headword, distractor: byId.get(o.wordId).headword, text: o.text });
  }
  // 抽样 30 题供人工看
  const r2 = seeded(2026); const sample: any[] = [];
  for (let i = 0; i < 30; i++) { const w = words[Math.floor(r2() * words.length)]; const qt = i % 2 ? 'meaning_choice' : 'listen_choice'; const q = buildQuestion(db, { id: 0, word_id: w.id, mode: 'recognize', state: 2 }, qt, r2); sample.push({ answer: w.headword, qtype: qt, prompt: q?.prompt, options: q?.options.map((o: any) => (o.wordId === w.id ? '✔ ' : '  ') + byId.get(o.wordId).headword + ' | ' + byId.get(o.wordId).meaning_zh.split('\n')[0]) }); }
  for (const hw of ['Miss', 'miss', 'Ms (AmE Ms.)', 'well', "o'clock", 'while', 'dear']) { const w = words.find(x => x.headword === hw); if (!w) continue; for (const qt of ['listen_choice', 'meaning_choice'] as const) { const q = buildQuestion(db, { id: 0, word_id: w.id, mode: 'recognize', state: 2 }, qt, seeded(1)); sample.push({ answer: hw, qtype: qt, prompt: q?.prompt, options: q?.options.map((o: any) => (o.wordId === w.id ? '✔ ' : '  ') + byId.get(o.wordId).headword + ' | ' + byId.get(o.wordId).meaning_zh.split('\n')[0]) }); } }
  R.stats = stats; R.violations = violations.length; R.violationExamples = violations.slice(0, 10);
  R.leaks = { rawExact: leaks.rawExact.length, afterMaskExact: leaks.afterMaskExact.length, stemOnly: leaks.afterMaskStemOnly.length, ownHeadInDistractorOption: leaks.ownHeadInDistractorOption.length };
  fs.writeFileSync('/workspace/vocab-saas/qa/v3-phase1/api/F1_distractor_leaks.json', JSON.stringify(leaks, null, 1));
  fs.writeFileSync('/workspace/vocab-saas/qa/v3-phase1/api/F1_sample30.json', JSON.stringify(sample, null, 1));
  db.close();
}

if (which === 'graduation') {
  const db = copy('f-grad.db');
  let cur = new Date('2026-10-20T02:00:00Z');
  const app = buildApp(db, { now: () => cur });
  const w = db.prepare("SELECT ww.word_id, w.headword FROM wrong_words ww JOIN words w ON w.id=ww.word_id WHERE ww.removed_at IS NULL ORDER BY ww.word_id LIMIT 1").get() as any;
  const card = db.prepare("SELECT id FROM cards WHERE word_id=? AND mode='recognize'").get(w.word_id) as any;
  const spell = db.prepare("SELECT id FROM cards WHERE word_id=? AND mode='spell'").get(w.word_id) as any;
  const row = () => { const r = db.prepare('SELECT wrong_count, correct_days, removed_at FROM wrong_words WHERE word_id=?').get(w.word_id) as any; return { wc: r.wrong_count, days: JSON.parse(r.correct_days), removed: r.removed_at }; };
  const steps: any[] = [];
  const act = async (label: string, day: string, rating: number | 'hint', ctx = 'practice') => {
    cur = new Date(day + 'T10:00:00+08:00'); cur = new Date(cur.getTime() + steps.length * 1000);
    let res;
    if (rating === 'hint') res = await app.inject({ method: 'POST', url: '/api/check', payload: { cardId: spell.id, answer: w.headword.split(/[ (（]/)[0], usedHint: true, answerId: uid(), context: ctx } });
    else res = await app.inject({ method: 'POST', url: '/api/review', payload: { cardId: card.id, rating, answerId: uid(), context: ctx } });
    const lg = db.prepare('SELECT rating,counted,context FROM review_logs ORDER BY id DESC LIMIT 1').get();
    steps.push({ label, at: cur.toISOString(), status: res.statusCode, log: lg, after: row() });
  };
  steps.push({ label: 'initial', after: row(), word: w.headword });
  await act('Again 忘了', '2026-10-20', 1);
  await act('Good 认识', '2026-10-21', 3);
  await act('Good 同日第二次', '2026-10-21', 3);
  await act('Hard 模糊', '2026-10-22', 2);
  await act('拼写用提示(Hard)', '2026-10-22', 'hint');
  await act('Easy 很熟', '2026-10-24', 4);
  await act('Again 清零', '2026-10-25', 1);
  await act('Good d1', '2026-10-26', 3);
  await act('Hard 中间', '2026-10-27', 2);
  await act('Good d2(隔天)', '2026-10-28', 3);
  await act('Easy d3 → 应移出', '2026-11-02', 4);
  const wc = row().wc;
  await app.inject({ method: 'POST', url: `/api/wrong/${w.word_id}`, payload: { inBook: true } });
  steps.push({ label: '手动放回', after: row(), wrongCountUnchanged: row().wc === wc });
  // 不在错词本里的词手动加入
  const nw = db.prepare("SELECT id FROM words WHERE id NOT IN (SELECT word_id FROM wrong_words) LIMIT 1").get() as any;
  await app.inject({ method: 'POST', url: `/api/wrong/${nw.id}`, payload: { inBook: true } });
  steps.push({ label: '手动加入新词', row: db.prepare('SELECT wrong_count,correct_days,removed_at FROM wrong_words WHERE word_id=?').get(nw.id) });
  R.steps = steps; db.close();
}

if (which === 'midnight') {
  const db = copy('f-mid.db', D + 'mine-own.db');
  let cur = new Date('2026-10-20T15:50:00Z');
  const app = buildApp(db, { now: () => cur });
  const out: any[] = [];
  const answerAny = async (n: any) => { if (n.question) { const a = (db.prepare('SELECT answer_word_id FROM question_issues WHERE id=?').get(n.question.id) as any).answer_word_id; return (await app.inject({ method: 'POST', url: '/api/answer', payload: { questionId: n.question.id, choiceWordId: a, answerId: uid() } })).statusCode; } return (await app.inject({ method: 'POST', url: '/api/review', payload: { cardId: n.card.id, rating: 3, answerId: uid() } })).statusCode; };
  const codes: number[] = [];
  for (let i = 0; i < 10; i++) { cur = new Date(Date.parse('2026-10-20T15:50:00Z') + i * 59_000); const n = (await app.inject('/api/next')).json(); codes.push(await answerAny(n)); }
  out.push({ first10Status: codes });
  for (const t of ['2026-10-20T15:59:59.999Z', '2026-10-20T16:00:00.000Z']) { cur = new Date(t); const s = (await app.inject('/api/today')).json(); out.push({ now: t, shDay: shDay(cur), today: { day: s.day, review: s.review, new: s.new, completed: s.completed } }); }
  cur = new Date('2026-10-20T15:59:30Z'); // 无：额度已满时 /api/next 无新词
  out.push({ now: cur.toISOString(), nextCard: (await app.inject('/api/next')).json().card?.headword ?? null });
  cur = new Date('2026-10-20T16:00:30Z'); const n = (await app.inject('/api/next')).json();
  const st = await answerAny(n);
  out.push({ now: cur.toISOString(), answered: n.card.headword, qtype: n.question?.qtype ?? 'flip/spell', status: st, logReviewAt: (db.prepare('SELECT review_at FROM review_logs ORDER BY id DESC LIMIT 1').get() as any).review_at });
  out.push({ dailyStats: db.prepare('SELECT day,new_count,answers,completed,completed_at FROM daily_stats ORDER BY day').all() });
  out.push({ spellCardsDue: db.prepare("SELECT DISTINCT due FROM cards WHERE mode<>'recognize'").all() });
  R.midnight = out; db.close();
}

if (which === 'quota') {
  const dbs = [copy('f-q1.db'), copy('f-q0.db')];
  dbs[1].prepare("UPDATE settings SET value='0' WHERE key='choice_enabled'").run();
  let cur = new Date('2026-10-15T01:00:00Z');
  const apps = dbs.map((db, i) => buildApp(db, { now: () => cur, rng: seeded(99) }));
  const served = [[], []] as number[][]; let mismatch = 0, steps = 0; const qt = [{} as any, {} as any];
  for (let step = 0; step < 600; step++) {
    cur = new Date(Date.parse('2026-10-15T01:00:00Z') + step * 30_000);
    const s = dbs.map(d => todaySummary(d, cur)); if (JSON.stringify(s[0]) !== JSON.stringify(s[1])) mismatch++;
    const ns = await Promise.all(apps.map(a => a.inject('/api/next').then(r => r.json())));
    if (!ns[0].card && !ns[1].card) continue;
    if (ns[0].card?.id !== ns[1].card?.id) { mismatch++; }
    steps++;
    for (let i = 0; i < 2; i++) {
      const { card, question } = ns[i]; if (!card) continue; served[i].push(card.id);
      const k = question ? question.qtype : card.mode === 'recognize' ? 'flip' : card.mode; qt[i][k] = (qt[i][k] ?? 0) + 1;
      if (question) { const a = (dbs[i].prepare('SELECT answer_word_id FROM question_issues WHERE id=?').get(question.id) as any).answer_word_id; await apps[i].inject({ method: 'POST', url: '/api/answer', payload: { questionId: question.id, choiceWordId: a, answerId: uid() } }); }
      else if (card.mode === 'recognize') await apps[i].inject({ method: 'POST', url: '/api/review', payload: { cardId: card.id, rating: 3, answerId: uid() } });
      else await apps[i].inject({ method: 'POST', url: '/api/check', payload: { cardId: card.id, answer: card.headword.split(/[ (（]/)[0], answerId: uid() } });
    }
  }
  const end = dbs.map(d => ({ logsToday: (d.prepare("SELECT COUNT(*) n FROM review_logs WHERE review_at>='2026-10-14T16:00:00Z'").get() as any).n, cardsHash: crypto.createHash('sha256').update(JSON.stringify(d.prepare('SELECT id,due,state,reps FROM cards ORDER BY id').all())).digest('hex').slice(0, 16), stat: d.prepare("SELECT new_count,review_count,answers,completed FROM daily_stats WHERE day='2026-10-15'").get() }));
  R.quota = { answeredSteps: steps, mismatchSteps: mismatch, sameServedSequence: JSON.stringify(served[0]) === JSON.stringify(served[1]), sameCardSet: JSON.stringify([...new Set(served[0])].sort()) === JSON.stringify([...new Set(served[1])].sort()), qtypes: qt, end };
  dbs.forEach(d => d.close());
}
console.log(JSON.stringify(R, null, 1));
