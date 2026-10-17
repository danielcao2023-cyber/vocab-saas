const B='http://127.0.0.1:18424';let n=0,stats={};
const post=(p,b)=>fetch(B+p,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)}).then(async r=>({s:r.status,j:await r.json().catch(()=>null)}));
for(;n<400;n++){const r=await fetch(B+'/api/next').then(r=>r.json());const c=r.card;if(!c){console.log('done after',n,JSON.stringify(stats));break;}
 const q=r.question;let res;const id=crypto.randomUUID();
 if(q){res=await post('/api/answer',{questionId:q.id,choiceWordId:c.word_id,answerId:id,durationMs:3000});stats[q.qtype]=(stats[q.qtype]||0)+1;}
 else if(c.mode==='recognize'){res=await post('/api/review',{cardId:c.id,rating:3,answerId:id,durationMs:3000});stats.flip=(stats.flip||0)+1;}
 else{const a=c.headword.replace(/\s*\(.*$/,'').trim();res=await post('/api/check',{cardId:c.id,answer:a,answerId:id});stats[c.mode]=(stats[c.mode]||0)+1;if(res.j&&res.j.correct===false)console.log('spell miss',c.headword,a);}
 if(res.s!==200){console.log('ERR',res.s,JSON.stringify(res.j),c.headword);break;}}
console.log(JSON.stringify(await fetch(B+'/api/today').then(r=>r.json()).then(t=>({completed:t.completed,streak:t.streak,review:t.review,new:t.new}))));
