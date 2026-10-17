// 独立验收自写：openDb 前后旧列逐行比对（不复用 verify-migration.ts）
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import fs from 'node:fs';
const require = createRequire('/workspace/vocab-saas/wt-v3/package.json');
const Database = require('better-sqlite3');
const { openDb } = await import('/workspace/vocab-saas/wt-v3/server/src/db.ts');
const file = process.argv[2];
const TABLES = ['words','cards','review_logs','wrong_words','settings'];
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
function snap(db: any, cols?: Record<string,string[]>) {
  const out: any = {};
  for (const t of TABLES) {
    const exists = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(t);
    if (!exists) { out[t] = null; continue; }
    const c = cols?.[t] ?? db.prepare(`PRAGMA table_info(${t})`).all().map((r: any) => r.name);
    const rows = db.prepare(`SELECT ${c.map((x: string) => `"${x}"`).join(',')} FROM ${t} ORDER BY rowid`).raw().all();
    out[t] = { cols: c, rows: rows.map((r: any[]) => JSON.stringify(r)) };
  }
  return out;
}
const fileSha = () => sha(fs.readFileSync(file).toString('binary'));
const sha0 = fileSha();
const ro = new Database(file, { readonly: true });
const before = snap(ro);
const tablesBefore = ro.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map((r: any) => r.name);
ro.close();
const cols = Object.fromEntries(TABLES.filter(t => before[t]).map(t => [t, before[t].cols]));
const report: any = { file, sha256_before: sha0, tablesBefore, opens: [] };
for (let i = 1; i <= 2; i++) {
  const db = openDb(file);
  const after = snap(db, cols);
  const per: any = {};
  for (const t of TABLES) {
    if (!before[t]) { per[t] = 'absent-before'; continue; }
    const b = before[t].rows, a = after[t].rows;
    let diff = 0; const ex: any[] = [];
    // settings: 只比旧键
    const aa = t === 'settings' ? a.filter((r: string) => b.some((x: string) => JSON.parse(x)[0] === JSON.parse(r)[0])) : a;
    for (let k = 0; k < Math.max(b.length, aa.length); k++) if (b[k] !== aa[k]) { diff++; if (ex.length < 3) ex.push({ before: b[k], after: aa[k] }); }
    per[t] = { rowsBefore: b.length, rowsAfter: a.length, oldColsCompared: before[t].cols.length, rowDiffs: diff, shaBefore: sha(b.join('\n')), shaAfter: sha(aa.join('\n')), examples: ex };
  }
  const newCols = db.prepare('PRAGMA table_info(review_logs)').all().map((r: any) => r.name).filter((c: string) => !before.review_logs.cols.includes(c));
  const newColNonNull = newCols.length ? (db.prepare(`SELECT COUNT(*) n FROM review_logs WHERE ${newCols.map((c: string) => `${c} IS NOT NULL`).join(' OR ')}`).get() as any).n : 0;
  const newSettings = db.prepare('SELECT key,value FROM settings ORDER BY key').all().filter((r: any) => !before.settings.rows.some((x: string) => JSON.parse(x)[0] === r.key));
  report.opens.push({ open: i, per, reviewLogNewCols: newCols, reviewLogNewColsNonNullRows: newColNonNull, newSettings,
    tablesAfter: db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map((r: any) => r.name),
    dailyStats: (db.prepare('SELECT COUNT(*) n FROM daily_stats').get() as any).n,
    integrity: db.pragma('integrity_check', { simple: true }) });
  db.close();
}
report.allUnchanged = report.opens.every((o: any) => Object.values(o.per).every((p: any) => p === 'absent-before' || p.rowDiffs === 0));
console.log(JSON.stringify(report, null, 2));
