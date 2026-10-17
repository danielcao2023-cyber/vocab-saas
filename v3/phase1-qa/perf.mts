import { openDb } from '/workspace/vocab-saas/wt-v3/server/src/db.ts';
import { recomputeDailyStats } from '/workspace/vocab-saas/wt-v3/server/src/stats.ts';
import fs from 'node:fs';
fs.copyFileSync('hist-b4429a2.db', 'perf.db'); const db = openDb('perf.db');
// 把 674 条日志复制 15 份（约 1 万条，相当于一年多）测单次回算耗时
const n = (db.prepare('SELECT COUNT(*) n FROM review_logs').get() as any).n;
for (let k = 1; k < 15; k++) db.prepare(`INSERT INTO review_logs(card_id,rating,state,due,stability,difficulty,elapsed_days,scheduled_days,review_at,duration_ms,answer,correct)
  SELECT card_id,rating,state,due,stability,difficulty,elapsed_days,scheduled_days,strftime('%Y-%m-%dT%H:%M:%fZ',review_at,'-${k * 20} days'),duration_ms,answer,correct FROM review_logs WHERE id<=?`).run(n);
const t = performance.now(); recomputeDailyStats(db, ['2026-10-14']); console.log('logs', (db.prepare('SELECT COUNT(*) n FROM review_logs').get() as any).n, 'one-day recompute ms', Math.round(performance.now() - t));
db.close(); fs.rmSync('perf.db');
