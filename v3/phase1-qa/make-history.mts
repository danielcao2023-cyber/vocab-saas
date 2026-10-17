import require_fs from 'node:fs';
// 用 b4429a2 的旧代码在 qa.db 副本上模拟 12 天学习历史（只写本目录下的副本）
import Database from 'better-sqlite3';
import { openDb } from './old-server/src/db.ts';
import { nextCard, review, checkSpelling, queueState } from './old-server/src/study.ts';
const src = '/workspace/vocab-saas/app/data/qa.db';
const out = process.argv[2] ?? 'hist-b4429a2.db';
const ro = new Database(src, { readonly: true }); await ro.backup(out); ro.close();
const db = openDb(out);
let seed = 42; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const start = Date.parse('2026-10-03T11:00:00Z'); // 上海 19:00
let n = 0; const expect: any[] = []; const steps: any[] = [];
for (let d = 0; d < 12; d++) {
  if (d === 4 || d === 8) continue; // 两天没学
  let t = start + d * 86400_000;
  for (let i = 0; i < 80; i++) {
    const now = new Date(t);
    const q = queueState(db, now); if (q.review + q.new === 0) break;
    const c: any = nextCard(db, now); if (!c) break;
    if (c.mode === 'recognize') review(db, c.id, (rnd() < 0.15 ? 1 : rnd() < 0.2 ? 2 : 3) as any, now, { durationMs: 3000 + Math.floor(rnd() * 9000), answerId: 'h' + n });
    else { const ok = rnd() < 0.75; checkSpelling(db, c.id, ok ? c.headword.replace(/[’]/g, "'").split(/[ (/]/)[0] : 'zzz', now, false, 'h' + n); }
    { const q = queueState(db, now); steps.push({ t: now.toISOString(), ...q, ids: (db.prepare("SELECT c.id FROM cards c WHERE (c.state<>0 OR c.mode<>'recognize') AND c.due <= ? ORDER BY c.id").all(now.toISOString()) as any[]).map(r => r.id) }); }
    n++; t += 20_000;
  }
  const e = queueState(db, new Date(t)); expect.push({ day: new Date(t + 8*3600_000).toISOString().slice(0,10), done: e.review + e.new === 0, left: e });
}
require_fs.writeFileSync(out + '.expect.json', JSON.stringify(expect)); require_fs.writeFileSync(out + '.steps.json', JSON.stringify(steps));
const cnt = (s: string) => (db.prepare(s).get() as any).n;
console.log(JSON.stringify({ out, logs: cnt('select count(*) n from review_logs'), cards: cnt('select count(*) n from cards'), wrong: cnt('select count(*) n from wrong_words'), removed: cnt('select count(*) n from wrong_words where removed_at is not null') }));
db.pragma('wal_checkpoint(TRUNCATE)'); db.close();
