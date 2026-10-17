import { openDb, type DB } from '../server/src/db.ts';
export const T = new Date('2026-10-17T01:00:00Z');
export const day = (n: number) => new Date(T.getTime() + n * 86400_000);
export function seeded(seed = 123) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
export function words(db: DB, n = 16) {
  for (let i = 1; i <= n; i++) db.prepare('INSERT INTO words(headword,meaning_zh,source,level,priority,meaning_source) VALUES (?,?,?,?,?,?)').run(`word${i}`, `n. 义项${i}`, 'kb2022', i % 3 ? '三级' : '二级', i % 3 ? 2 : 1, 'ecdict');
}
export function database(n = 16) { const db = openDb(':memory:'); words(db,n); return db; }
export function card(db: DB, wordId = 1, mode = 'recognize', state = 2, due = T.toISOString()) {
  return Number(db.prepare('INSERT INTO cards(word_id,mode,due,stability,difficulty,elapsed_days,scheduled_days,reps,lapses,state) VALUES (?,?,?,5,5,1,1,2,0,?)').run(wordId,mode,due,state).lastInsertRowid);
}
