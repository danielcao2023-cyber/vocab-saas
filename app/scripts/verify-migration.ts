import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { openDb, type DB } from '../server/src/db.ts';
const tables = ['words','cards','review_logs','wrong_words','settings'];
function snapshot(db: DB) {
  return Object.fromEntries(tables.map(table => [table, { columns: (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(r => r.name), rows: db.prepare(`SELECT * FROM ${table} ORDER BY ${table === 'settings' ? 'key' : table === 'wrong_words' ? 'word_id' : 'id'}`).all() as Record<string, unknown>[] }]));
}
export function verifyMigration(file: string) {
  // The source is only ever opened readonly. serialize includes committed WAL pages.
  const original = new Database(path.resolve(file), { readonly: true, fileMustExist: true });
  let bytes: Buffer; let before: ReturnType<typeof snapshot>;let beforeTables: string[];
  try { before = snapshot(original);beforeTables = (original.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as {name:string}[]).map(t=>t.name); bytes = original.serialize(); } finally { original.close(); }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocab-migration-'));
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
    return { tables: comparison, oldColumnsUnchanged: Object.values(comparison).every((t: any) => t.oldColumnsUnchanged), addedTables: ['question_issues','daily_stats','streak_makeups'].filter(t => !beforeTables.includes(t) && copy!.prepare('SELECT 1 FROM sqlite_master WHERE type=\'table\' AND name=?').get(t)), dailyStatsRows: (copy.prepare('SELECT COUNT(*) n FROM daily_stats').get() as { n: number }).n, integrity_check: copy.pragma('integrity_check', { simple: true }) };
  } finally { copy?.close(); fs.rmSync(dir, { recursive: true, force: true }); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const index = process.argv.indexOf('--db');
  if (index < 0 || !process.argv[index + 1]) { process.stderr.write('Usage: tsx scripts/verify-migration.ts --db <path>\n'); process.exitCode = 1; }
  else { try { const report=verifyMigration(process.argv[index + 1]);process.stdout.write(JSON.stringify(report, null, 2) + '\n');if(!report.oldColumnsUnchanged||report.integrity_check!=='ok')process.exitCode=1; } catch (e) { process.stderr.write((e as Error).message + '\n'); process.exitCode = 1; } }
}
