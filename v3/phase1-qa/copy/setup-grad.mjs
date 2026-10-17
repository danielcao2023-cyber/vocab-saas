// 只改 18424 的副本库 wt-v3/data/qa-v3-hist.db：给错词本第一名的词造 2 个不同日子的答对记录（合成，不是真实作答）
import Database from '/workspace/vocab-saas/wt-v3/node_modules/better-sqlite3/lib/index.js';
const db = new Database('/workspace/vocab-saas/wt-v3/data/qa-v3-hist.db');
const top = db.prepare(`SELECT w.id,w.headword,ww.correct_days FROM wrong_words ww JOIN words w ON w.id=ww.word_id WHERE ww.removed_at IS NULL ORDER BY ww.wrong_count DESC,ww.last_wrong_at DESC,ww.word_id LIMIT 1`).get();
db.prepare(`UPDATE wrong_words SET correct_days='["2026-10-15","2026-10-16"]' WHERE word_id=?`).run(top.id);
const two = db.prepare(`SELECT w.headword FROM wrong_words ww JOIN words w ON w.id=ww.word_id WHERE ww.removed_at IS NULL`).all().filter(()=>true);
console.log(JSON.stringify({ top, before: top.correct_days }));
