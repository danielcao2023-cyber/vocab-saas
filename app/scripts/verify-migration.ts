import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { openDb, type DB } from '../server/src/db.ts';
import { productionGate, readSnapshot } from '../server/src/guard.ts';
const tables = ['words','cards','review_logs','wrong_words','settings','word_content','content_feedback','ai_jobs','ai_cache'];
function snapshot(db: DB) {
  return Object.fromEntries(tables.map(table => [table, { columns: (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(r => r.name), rows: db.prepare(`SELECT * FROM ${table} ORDER BY ${table === 'ai_cache' ? 'key_hash' : table === 'settings' ? 'key' : table === 'wrong_words' ? 'word_id' : 'id'}`).all() as Record<string, unknown>[] }]));
}
export function verifyMigration(file: string, opts: { allowProduction?: boolean; home?: string } = {}) {
  // 只读核对：正式库（$HOME/apps 下）需显式 --allow-production；源库只读快照，不在库旁生成文件。
  productionGate(file, { allowProduction: opts.allowProduction, dryRun: true, readOnly: true, home: opts.home });
  if (!fs.existsSync(file)) throw new Error(`${file} 不存在`);
  const snap = Buffer.from(readSnapshot(path.resolve(file))); if (snap.length >= 100) { snap[18] = 1; snap[19] = 1; }
  const original = new Database(snap);
  let bytes: Buffer; let before: ReturnType<typeof snapshot>;let beforeTables: string[];
  try { before = snapshot(original);beforeTables = (original.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as {name:string}[]).map(t=>t.name); bytes = original.serialize(); } finally { original.close(); }
  const temp = path.resolve('../.tmp'); fs.mkdirSync(temp,{recursive:true});
  const dir = fs.mkdtempSync(path.join(temp, 'vocab-migration-'));
  const copyPath = path.join(dir, 'copy.sqlite');
  let copy: DB | undefined;
  try {
    if (bytes.length >= 100) { bytes[18] = 1; bytes[19] = 1; }
    fs.writeFileSync(copyPath, bytes);
    copy = openDb(copyPath);
    const after = snapshot(copy);
    const comparison = Object.fromEntries(tables.map(table => {
      const b = before[table], a = after[table];
      const oldRows = a.rows.filter(row => table !== 'settings' || b.rows.some(old => old.key === row.key));
      const projected = oldRows.map(row => Object.fromEntries(b.columns.map(c => [c, row[c]])));
      return [table, { before: b.rows.length, after: a.rows.length, oldColumnsUnchanged: JSON.stringify(b.rows) === JSON.stringify(projected), addedColumns: a.columns.filter(c => !b.columns.includes(c)) }];
    }));
    return { tables: comparison, oldColumnsUnchanged: Object.values(comparison).every((t: any) => t.oldColumnsUnchanged), addedTables: ['question_issues','daily_stats','streak_makeups','word_forms','word_freq'].filter(t => !beforeTables.includes(t) && copy!.prepare('SELECT 1 FROM sqlite_master WHERE type=\'table\' AND name=?').get(t)), dailyStatsRows: (copy.prepare('SELECT COUNT(*) n FROM daily_stats').get() as { n: number }).n, integrity_check: copy.pragma('integrity_check', { simple: true }) };
  } finally { copy?.close(); fs.rmSync(dir, { recursive: true, force: true }); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const index = process.argv.indexOf('--db');
  if (index < 0 || !process.argv[index + 1]) { process.stderr.write('Usage: tsx scripts/verify-migration.ts --db <path>\n'); process.exitCode = 1; }
  else { try { const report=verifyMigration(process.argv[index + 1], { allowProduction: process.argv.includes('--allow-production') });process.stdout.write(JSON.stringify(report, null, 2) + '\n');if(!report.oldColumnsUnchanged||report.integrity_check!=='ok')process.exitCode=1; } catch (e) { process.stderr.write((e as Error).message + '\n'); process.exitCode = 1; } }
}
