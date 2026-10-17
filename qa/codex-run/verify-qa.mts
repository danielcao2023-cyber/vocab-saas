import Database from '/workspace/vocab-saas/app/node_modules/better-sqlite3/lib/index.js';
import { openDb } from '/workspace/vocab-saas/app/server/src/db.ts';
import { nextCard, review, acceptedSpellings } from '/workspace/vocab-saas/app/server/src/study.ts';
const ro = new Database('data/qa.db', { readonly: true });
console.log('counts', ro.prepare(`SELECT COUNT(*) total, SUM(level='二级') l2, SUM(level='三级') l3, SUM(priority=2) p2, SUM(priority=1) p1, SUM(meaning_source='manual') manual, SUM(meaning_flag IS NOT NULL) flagged, SUM(phonetic IS NULL) nophon FROM words WHERE source='kb2022'`).get());
console.log('all words', ro.prepare('SELECT source,is_sample,COUNT(*) n FROM words GROUP BY 1,2').all(), 'cards', ro.prepare('SELECT COUNT(*) n FROM cards').get(), 'logs', ro.prepare('SELECT COUNT(*) n FROM review_logs').get());
console.log('settings', ro.prepare("SELECT * FROM settings").all());
for (const hw of ['can','will','well','still','Miss','miss','Ms (AmE Ms.)',"o'clock",'laptop','online','app (= application)'])
  console.log(JSON.stringify(ro.prepare('SELECT headword,entry_raw,ecdict_key,phonetic,level,priority,freq_rank,meaning_source,meaning_flag,meaning_zh FROM words WHERE source=? AND headword=?').get('kb2022', hw)), '| accept', JSON.stringify(acceptedSpellings(hw)));
console.log('curly left', ro.prepare("SELECT COUNT(*) n FROM words WHERE headword LIKE '%’%'").get());
// simulate first 20 new cards on an in-memory copy
const buf = ro.serialize(); buf[18] = 1; buf[19] = 1; ro.close();
const mem = new Database(buf);
mem.prepare("UPDATE settings SET value='100' WHERE key='new_per_day'").run();
const t = new Date('2026-10-17T04:40:00Z'); const seq: string[] = [];
for (let i = 0; i < 20; i++) { const c: any = nextCard(mem as any, t, 'new'); const w: any = mem.prepare('SELECT level,freq_rank FROM words WHERE id=?').get(c.word_id); seq.push(`${i+1}.${c.headword}[${w.level === '二级' ? 'L2' : 'core'} ${w.freq_rank}]`); review(mem as any, c.id, 3 as any, t); }
console.log(seq.join('  '));
