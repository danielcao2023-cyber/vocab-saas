import fs from 'node:fs'; import crypto from 'node:crypto';
const W='/workspace/vocab-saas/wt-v3/server/src/';
const { openDb } = await import(W+'db.ts'); const { buildApp } = await import(W+'app.ts');
const D='/workspace/vocab-saas/qa/v3-phase1/api/fix1/db/'; fs.copyFileSync(D+'pristine.db', D+'parent.db');
const db=openDb(D+'parent.db'); let now=new Date('2026-10-17T02:00:00Z'); const app=buildApp(db,{now:()=>now});
for(let i=0;i<5;i++){ const n=(await app.inject('/api/next')).json(); if(n.question){const a=(db.prepare('SELECT answer_word_id a FROM question_issues WHERE id=?').get(n.question.id) as any).a; await app.inject({method:'POST',url:'/api/answer',payload:{questionId:n.question.id,choiceWordId:a,answerId:crypto.randomUUID()}});} else if(n.card.mode==='recognize') await app.inject({method:'POST',url:'/api/review',payload:{cardId:n.card.id,rating:3,answerId:crypto.randomUUID()}}); else await app.inject({method:'POST',url:'/api/check',payload:{cardId:n.card.id,answer:n.card.headword,answerId:crypto.randomUUID()}}); }
const H=()=>Object.fromEntries((db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[]).map(t=>[t.name,crypto.createHash('sha256').update(JSON.stringify(db.prepare(`SELECT * FROM "${t.name}" ORDER BY rowid`).all())).digest('hex')]));
const out:any={};
// 情形1：今天行是最新的
let h0=H(); let r=await app.inject('/api/parent/summary?days=30'); let h1=H(); out.fresh={status:r.statusCode,changed:Object.keys(h0).filter(k=>h0[k]!==h1[k])};
// 情形2：删掉今天那一行后调用（应只重建 daily_stats 今天一行）
db.prepare("DELETE FROM daily_stats WHERE day='2026-10-17'").run(); const others0=JSON.stringify(db.prepare("SELECT * FROM daily_stats WHERE day<>'2026-10-17' ORDER BY day").all());
h0=H(); r=await app.inject('/api/parent/summary?days=30'); h1=H();
out.staleToday={status:r.statusCode,changed:Object.keys(h0).filter(k=>h0[k]!==h1[k]),otherDaysSame:others0===JSON.stringify(db.prepare("SELECT * FROM daily_stats WHERE day<>'2026-10-17' ORDER BY day").all()),todayRow:db.prepare("SELECT day,answers,completed FROM daily_stats WHERE day='2026-10-17'").get()};
console.log(JSON.stringify(out));
