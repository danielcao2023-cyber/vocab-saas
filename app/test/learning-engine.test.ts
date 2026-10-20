import {afterEach,expect,it} from 'vitest';
import {wordDifficulty} from '../server/src/learning/selection';
import {upsertWords} from '../server/src/import';
import {openDb,type DB} from '../server/src/db';
import {learningToday,startLearning,nextLearning,answerLearning,consultLearning,deferLearning,learningBooks} from '../server/src/learning/engine';
const dbs:DB[]=[];afterEach(()=>dbs.splice(0).forEach(db=>db.close()));
function fixture(n=50){const db=openDb(':memory:');dbs.push(db);const meanings=['苹果','奔跑','昨天','上方','学校','美丽','长久','读书'];for(let i=1;i<=n;i++)db.prepare('INSERT INTO words(id,headword,meaning_zh,source,level,priority,freq_rank) VALUES (?,?,?,?,?,?,?)').run(i,'word'+String.fromCharCode(96+(i%26||26))+String.fromCharCode(97+Math.floor(i/26)),meanings[i%8], 'kb2022',i<=35?'三级':'二级',i<=35?2:1,i);return db;}
const initial=new Date('2026-10-20T09:00:00+08:00');
function respond(db:DB,turn:any,now:Date,correct=true,id:string=crypto.randomUUID()){const card=turn.card;return answerLearning(db,{issueId:card.issueId,answerId:id,...(card.mode==='recognize'?{choiceId:correct?card.wordId:0}:{answer:correct?(db.prepare('SELECT headword FROM words WHERE id=?').get(card.wordId) as any).headword:'wrong'})},now);}
it('freezes forty unique balanced words only on start and preserves the plan on repeated starts',()=>{
 const db=fixture();const before=db.prepare('SELECT COUNT(*) n FROM cards').get();expect(learningToday(db,initial)).toMatchObject({total:40,started:false,newWords:40});expect(db.prepare('SELECT COUNT(*) n FROM cards').get()).toEqual(before);
 startLearning(db,initial);const ids=(db.prepare('SELECT word_id FROM learning_day_words').all() as any[]).map(r=>r.word_id);expect(new Set(ids).size).toBe(40);expect(ids.filter(id=>id<=35)).toHaveLength(28);
 startLearning(db,initial);expect(db.prepare('SELECT COUNT(*) n FROM learning_day_words').get()).toEqual({n:40});expect(learningToday(db,initial).started).toBe(true);
});
it('requires nine unassisted successes per new word and keeps FSRS separate from book classification',()=>{
 const db=fixture(1);let now=new Date(initial);startLearning(db,now);const seen:string[]=[];
 for(let i=0;i<9;i++){const turn=nextLearning(db,now);expect(turn.kind).toBe('card');seen.push(turn.card!.mode);respond(db,turn,now);now=new Date(now.getTime()+20*60000);}
 expect(seen.filter(m=>m==='dictation')).toHaveLength(3);expect(learningBooks(db,'mastered',1,now).total).toBe(1);expect(learningToday(db,now).completed).toBe(1);expect(db.prepare('SELECT mastered_new,completed FROM daily_stats WHERE day=?').get('2026-10-20')).toEqual({mastered_new:1,completed:1});expect(nextLearning(db,now).kind).toBe('done');
 expect((db.prepare('SELECT COUNT(*) n FROM review_logs').get() as any).n).toBe(9);
 const nextDay=new Date('2026-10-21T09:00:00+08:00');expect(learningToday(db,nextDay).reviewWords).toBe(1);
});
it('downgrades immediately on failures, retries idempotently and does not erase daily errors after correction',()=>{
 const db=fixture(1);startLearning(db,initial);let turn=nextLearning(db,initial);const id='saved-once';const r=respond(db,turn,initial,false,id);expect(respond(db,turn,initial,false,id)).toEqual(r);expect((db.prepare('SELECT COUNT(*) n FROM review_logs').get() as any).n).toBe(1);
 expect(()=>respond(db,turn,initial,true,'another')).toThrow();let now=new Date(initial.getTime()+20*60000);turn=nextLearning(db,now);respond(db,turn,now,false);
 for(let i=0;i<12;i++){now=new Date(now.getTime()+20*60000);turn=nextLearning(db,now);if(turn.kind==='done')break;respond(db,turn,now);}
 expect(learningBooks(db,'unfamiliar',1,now).total).toBe(1);
});
it('waits instead of completing early, preserves the open issue, rejects a midnight stale answer and consults prevent pristine mastery',()=>{
 const db=fixture(1);startLearning(db,initial);const turn=nextLearning(db,initial);expect(nextLearning(db,initial).card!.issueId).toBe(turn.card!.issueId);consultLearning(db,turn.card!.issueId,initial);respond(db,turn,initial);expect(nextLearning(db,initial).kind).toBe('waiting');
 let now=new Date(initial);for(let i=0;i<12;i++){now=new Date(now.getTime()+20*60000);const t=nextLearning(db,now);if(t.kind==='done')break;respond(db,t,now);}
 expect(learningBooks(db,'mastered',1,now).total).toBe(0);expect(learningBooks(db,'familiar',1,now).total).toBe(1);
 const tomorrow=new Date('2026-10-21T09:00:00+08:00');startLearning(db,tomorrow);const old=nextLearning(db,tomorrow);expect(()=>respond(db,old,new Date('2026-10-22T09:00:00+08:00'))).toThrow();
});
it('probes a mastered word once, then applies one-error and two-error downgrades with remedial practice',()=>{
 const db=fixture(1);let now=new Date(initial);startLearning(db,now);for(let i=0;i<9;i++){respond(db,nextLearning(db,now),now);now=new Date(now.getTime()+20*60000);}
 now=new Date('2026-10-21T09:00:00+08:00');startLearning(db,now);respond(db,nextLearning(db,now),now,false);expect(learningBooks(db,'familiar',1,now).total).toBe(1);
 now=new Date(now.getTime()+20*60000);respond(db,nextLearning(db,now),now,false);expect(learningBooks(db,'unfamiliar',1,now).total).toBe(1);
 for(let i=0;i<3;i++){now=new Date(now.getTime()+20*60000);respond(db,nextLearning(db,now),now);}
 expect(nextLearning(db,now).kind).toBe('done');expect(learningBooks(db,'unfamiliar',1,now).total).toBe(1);
 now=new Date('2026-10-22T09:00:00+08:00');startLearning(db,now);for(let i=0;i<3;i++){respond(db,nextLearning(db,now),now);now=new Date(now.getTime()+20*60000);}expect(learningBooks(db,'familiar',1,now).total).toBe(1);
});
it('preserves legacy history and prioritizes overdue review over new-word composition',()=>{
 const db=fixture();const now=new Date(initial);startLearning(db,now);
 const before=(db.prepare('SELECT COUNT(*) n FROM review_logs').get() as any).n;
 db.prepare("UPDATE learning_words SET book='unfamiliar',initial_done=1,due='2026-10-19T00:00:00.000Z'").run();
 const tomorrow=new Date('2026-10-21T09:00:00+08:00');expect(learningToday(db,tomorrow)).toMatchObject({reviewWords:40,newWords:0});startLearning(db,tomorrow);
 expect((db.prepare('SELECT COUNT(*) n FROM review_logs').get() as any).n).toBe(before);
});
it('does not keep an old unfinished day as a permanent review obligation after later completion',()=>{
 const db=fixture(1);startLearning(db,initial);let now=new Date('2026-10-21T09:00:00+08:00');startLearning(db,now);for(let i=0;i<9;i++){respond(db,nextLearning(db,now),now);now=new Date(now.getTime()+20*60000);}
 db.prepare("UPDATE learning_words SET due='2026-11-20T00:00:00.000Z' WHERE word_id=1").run();
 expect(learningToday(db,new Date('2026-10-23T09:00:00+08:00')).reviewWords).toBe(0);
});

it('keeps yesterday’s untouched planned words before filling with fresh words',()=>{
 const db=fixture(60);startLearning(db,initial);const ids=(db.prepare('SELECT word_id FROM learning_day_words ORDER BY position').all() as any[]).map(x=>x.word_id);
 db.prepare('UPDATE words SET freq_rank=1 WHERE id>40').run();
 const nextDay=new Date('2026-10-21T09:00:00+08:00');startLearning(db,nextDay);
 const tomorrow=(db.prepare('SELECT word_id FROM learning_day_words WHERE day=?').all('2026-10-21') as any[]).map(x=>x.word_id);
 expect(tomorrow.sort((a,b)=>a-b)).toEqual(ids.sort((a,b)=>a-b));
});

it('clears sample learning state when replacing a practiced sample library',()=>{
 const db=fixture(1);db.prepare("UPDATE words SET source='sample',is_sample=1").run();startLearning(db,initial);respond(db,nextLearning(db,initial),initial);
 expect(()=>upsertWords(db,[{headword:'apple',level:'三级',pos:null}],new Map(),'kb2022',false,{clearSample:true})).not.toThrow();
 expect(db.prepare('SELECT COUNT(*) n FROM learning_day_words').get()).toEqual({n:0});expect(learningToday(db,initial)).toMatchObject({started:false,total:1});
});

it('balances easy medium and hard new words where the library provides them',()=>{
 const db=fixture(100);for(let i=1;i<=100;i++){const suffix=String.fromCharCode(97+i%26)+String.fromCharCode(97+Math.floor(i/26));db.prepare('UPDATE words SET headword=? WHERE id=?').run((i%5<2?'cat':i%5<4?'abandon':'communication')+suffix,i);}
 startLearning(db,initial);const words=db.prepare('SELECT headword FROM words JOIN learning_day_words d ON d.word_id=words.id').all() as {headword:string}[];
 expect([0,1,2].map(k=>words.filter(w=>wordDifficulty(w.headword)===k).length)).toEqual([16,16,8]);
});
it('defers unavailable dictation without awarding a pass or completing the day',()=>{
 const db=fixture(1);startLearning(db,initial);let now=new Date(initial);respond(db,nextLearning(db,now),now);now=new Date(now.getTime()+20*60000);respond(db,nextLearning(db,now),now);now=new Date(now.getTime()+20*60000);
 const turn=nextLearning(db,now);expect(turn.card!.mode).toBe('dictation');deferLearning(db,turn.card!.issueId,now);
 expect(learningToday(db,now)).toMatchObject({completed:0,deferred:1,answers:2});expect(nextLearning(db,now).kind).toBe('done');expect(learningBooks(db,'mastered',1,now).total).toBe(0);
 const tomorrow=new Date('2026-10-21T09:00:00+08:00');expect(learningToday(db,tomorrow).total).toBe(1);startLearning(db,tomorrow);expect(nextLearning(db,tomorrow).kind).toBe('card');
});
