import fs from 'node:fs';
import Database from 'better-sqlite3';
import { openDb } from '/workspace/vocab-saas/wt-v3/server/src/db.ts';
import { history, queueAt } from './dbg-stats.ts';
fs.copyFileSync('hist-b4429a2.db', 'dbg.db'); const db = openDb('dbg.db');
const steps = JSON.parse(fs.readFileSync('hist-b4429a2.db.steps.json', 'utf8')); const h = history(db); let shown = 0;
for (const s of steps) { (globalThis as any).ids = []; queueAt(db, h, new Date(s.t)); const got: number[] = (globalThis as any).ids;
  const miss = s.ids.filter((i: number) => !got.includes(i)), extra = got.filter(i => !s.ids.includes(i));
  if ((miss.length || extra.length) && shown++ < 3) { console.log(s.t, 'miss', miss, 'extra', extra);
    for (const id of [...miss, ...extra]) console.log(db.prepare('SELECT l.id,c.mode,l.rating,l.state,l.due,l.review_at,l.scheduled_days FROM review_logs l JOIN cards c ON c.id=l.card_id WHERE card_id=? ORDER BY l.id').all(id), (db.prepare('SELECT due,state FROM cards WHERE id=?').get(id))); } }
db.close(); fs.rmSync('dbg.db');
