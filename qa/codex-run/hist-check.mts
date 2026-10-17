import { openDb } from '/workspace/vocab-saas/app/server/src/db.ts';
import { nextCard, review } from '/workspace/vocab-saas/app/server/src/study.ts';
const db = openDb('/tmp/qa-scratch/hist.db'); const t = new Date();
for (let i = 0; i < 5; i++) { const c: any = nextCard(db, t, 'new'); review(db, c.id, (i % 2 ? 1 : 3) as any, t); }
const snap = () => JSON.stringify({ ids: db.prepare("SELECT group_concat(id) g FROM (SELECT id FROM words ORDER BY id)").get(), cards: db.prepare('SELECT id,word_id,mode,reps,state,due FROM cards ORDER BY id').all(), logs: db.prepare('SELECT COUNT(*) n FROM review_logs').get(), wrong: db.prepare('SELECT * FROM wrong_words').all() });
const fs = await import('node:fs'); fs.writeFileSync('/tmp/qa-scratch/snap1.json', snap()); db.close();
