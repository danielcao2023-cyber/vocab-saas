import type { DB } from './db.ts';
export function setting(db: DB, key: string, fallback: number): number {
  const row = db.prepare('SELECT value FROM settings WHERE key=?').get(key) as { value: string } | undefined;
  const value = row ? Number(row.value) : fallback;
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}
export function settings(db: DB): Record<string, string> {
  return Object.fromEntries((db.prepare('SELECT key,value FROM settings').all() as { key: string; value: string }[]).map(r => [r.key, r.value]));
}
