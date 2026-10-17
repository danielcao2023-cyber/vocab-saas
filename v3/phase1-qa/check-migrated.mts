import fs from 'node:fs';
import { openDb } from '/workspace/vocab-saas/wt-v3/server/src/db.ts';
import { queueStateAt, recomputeDailyStats } from '/workspace/vocab-saas/wt-v3/server/src/stats.ts';
const db = openDb('hist-migrated.db');
const expect = JSON.parse(fs.readFileSync('hist-b4429a2.db.expect.json', 'utf8'));
const rows = db.prepare('SELECT * FROM daily_stats ORDER BY day').all() as any[];
let bad = 0;
for (const e of expect) {
  const r = rows.find(x => x.day === e.day);
  const last = db.prepare(`SELECT MAX(review_at) t FROM review_logs WHERE review_at >= ? AND review_at < ?`).get(new Date(Date.parse(e.day + 'T00:00:00+08:00')).toISOString(), new Date(Date.parse(e.day + 'T00:00:00+08:00') + 86400e3).toISOString()) as any;
  const q = queueStateAt(db, new Date(Date.parse(last.t) + 20000));
  const ok = !!r && (r.completed === 1) === e.done && q.review === e.left.review && q.new === e.left.new;
  if (!ok) bad++;
  console.log(e.day, 'expect', e.done, JSON.stringify(e.left), 'got', r?.completed, JSON.stringify(q), r?.new_count, r?.review_count, r?.answers, r?.correct, r?.mastered_new, ok ? 'OK' : 'MISMATCH');
}
const before = JSON.stringify(db.prepare('SELECT * FROM daily_stats ORDER BY day').all());
db.exec('DELETE FROM daily_stats'); recomputeDailyStats(db);
console.log('recompute identical (ignoring nothing):', JSON.stringify(db.prepare('SELECT * FROM daily_stats ORDER BY day').all()) === before, 'mismatches', bad);
// direct SQL cross-check of counts
const sql = db.prepare(`SELECT date(datetime(l.review_at,'+8 hours')) d, SUM(c.mode='recognize' AND l.state=0) n, SUM(l.state<>0) r, COUNT(*) a, SUM(CASE WHEN l.correct IS NULL THEN l.rating>1 ELSE l.correct END) k FROM review_logs l JOIN cards c ON c.id=l.card_id GROUP BY d ORDER BY d`).all() as any[];
console.log('sql cross-check', sql.every(s => { const r = rows.find(x => x.day === s.d); return r && r.new_count === s.n && r.review_count === s.r && r.answers === s.a && r.correct === s.k; }));
db.close();
