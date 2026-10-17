// 旧表逐行快照（只读）：words/cards/review_logs/wrong_words/settings 的旧列
const D = require('better-sqlite3'); const crypto = require('crypto');
const [,, file, cols] = process.argv; const db = new D(file, { readonly: true });
const old = cols ? JSON.parse(require('fs').readFileSync(cols)) : null; const res = {};
for (const t of ['words', 'cards', 'review_logs', 'wrong_words', 'settings']) {
  const names = old ? old[t] : db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
  const rows = db.prepare(`SELECT ${names.join(',')} FROM ${t} ORDER BY rowid`).all();
  res[t] = { cols: names, n: rows.length, sha: crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex') };
}
console.log(JSON.stringify(res));
