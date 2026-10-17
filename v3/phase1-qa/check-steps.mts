import fs from 'node:fs';
import { openDb } from '/workspace/vocab-saas/wt-v3/server/src/db.ts';
import { queueStateAt } from '/workspace/vocab-saas/wt-v3/server/src/stats.ts';
fs.copyFileSync('hist-b4429a2.db', 'hist-steps.db'); const db = openDb('hist-steps.db');
const steps = JSON.parse(fs.readFileSync('hist-b4429a2.db.steps.json', 'utf8')); let bad = 0;
for (const s of steps) { const q = queueStateAt(db, new Date(s.t)); if (q.review !== s.review || q.new !== s.new) { bad++; if (bad < 5) console.log('MISMATCH', s, q); } }
console.log('steps', steps.length, 'mismatches', bad); db.close(); fs.rmSync('hist-steps.db');
