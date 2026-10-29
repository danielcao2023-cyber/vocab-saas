import {expect,it} from 'vitest';
import {makeV3Fixture} from './learning-v3-helpers';
import {startLearning,nextLearning,answerLearning,deferLearning,learningToday} from '../server/src/learning/engine';
const base=new Date('2026-10-21T01:00:00Z');const day=(n:number)=>new Date(+base+n*86400000);
function answer(db:any,n:number){const c=nextLearning(db,day(n)).card!;return answerLearning(db,{policyVersion:3,issueId:c.issueId,answerId:'answer-'+n,...(c.mode==='recognize'?{choiceId:c.wordId}:{answer:'experience'})},day(n));}
it('backs off repeated audio-only failures without rating memory, and resumes listening automatically',()=>{
 const db=makeV3Fixture(1,base);try{
 for(const n of [0,1]){startLearning(db,day(n));expect(nextLearning(db,day(n)).card?.mode).toBe('spell');answer(db,n)}
 startLearning(db,day(3));let c=nextLearning(db,day(3)).card!;expect(c.mode).toBe('dictation');deferLearning(db,c.issueId,day(3));
 startLearning(db,day(4));c=nextLearning(db,day(4)).card!;expect(c.mode).toBe('dictation');const logs=db.prepare('SELECT * FROM review_logs ORDER BY id').all();const cards=db.prepare('SELECT * FROM cards ORDER BY id').all();deferLearning(db,c.issueId,day(4));expect(db.prepare('SELECT * FROM review_logs ORDER BY id').all()).toEqual(logs);expect(db.prepare('SELECT * FROM cards ORDER BY id').all()).toEqual(cards);
 startLearning(db,day(5));const during=nextLearning(db,day(5));expect(during.card?.mode).not.toBe('dictation');if(during.card)answer(db,5);
 startLearning(db,day(6));c=nextLearning(db,day(6)).card!;expect(c.mode).toBe('dictation');expect(answer(db,6).correct).toBe(true);
 }finally{db.close()}
});
it('fills other daily slots while a single audio-only debt is cooling',()=>{
 const db=makeV3Fixture(1,base);try{
 for(const n of [0,1]){startLearning(db,day(n));answer(db,n)}
 for(const n of [3,4]){startLearning(db,day(n));const c=nextLearning(db,day(n)).card!;expect(c.mode).toBe('dictation');deferLearning(db,c.issueId,day(n));}
 db.prepare("UPDATE cards SET reps=1,due='2026-12-01T00:00:00.000Z' WHERE mode<>'dictation'").run();db.prepare("UPDATE learning_card_state SET delayed_successes=1,verification_due=NULL WHERE card_id IN (SELECT id FROM cards WHERE mode<>'dictation')").run();
 for(let i=2;i<=51;i++)db.prepare('INSERT INTO words(id,headword,meaning_zh,source,priority,freq_rank) VALUES (?,?,?,?,?,?)').run(i,'fresh'+String.fromCharCode(65+i),`新词${i}`,'kb2022',1,i);
 startLearning(db,day(5));expect(learningToday(db,day(5)).total).toBe(40);expect(db.prepare('SELECT word_id FROM learning_day_words WHERE day=?').all('2026-10-26')).not.toContainEqual({word_id:1});
 }finally{db.close()}
});
it('survives offline reopening and retries at the capped interval without changing memory evidence',async()=>{
 const {openBrowserDatabase,asSharedDb}=await import('../web/src/offline/sqlite');let source=makeV3Fixture(1,base);
 try{
  for(const n of [0,1]){startLearning(source,day(n));answer(source,n)}
  for(const n of [3,4]){startLearning(source,day(n));const c=nextLearning(source,day(n)).card!;expect(c.mode).toBe('dictation');deferLearning(source,c.issueId,day(n));}
  const mobile=await openBrowserDatabase(source.serialize());source.close();
  try{const db=asSharedDb(mobile);const cards=db.prepare('SELECT * FROM cards ORDER BY id').all();for(const n of [5,6,7,8,9,10,11,12,13,14,15,16,17]){startLearning(db,day(n));const c=nextLearning(db,day(n)).card;if(!c)continue;if(c.mode==='dictation'){expect([6,10,17]).toContain(n);deferLearning(db,c.issueId,day(n));}else answer(db,n)}
   const events=db.prepare("SELECT COUNT(*) n FROM learning_events WHERE kind='technical_defer'").get() as {n:number};expect(events.n).toBe(5);const after=db.prepare("SELECT * FROM cards WHERE mode='dictation'").all();expect(after).toEqual(cards.filter((c:any)=>c.mode==='dictation'));
  }finally{mobile.close()}
 }catch(e){try{source.close()}catch{}throw e}
});
it('does not re-add an old unfinished unintroduced cooling word through the fresh pool',()=>{
 const db=makeV3Fixture(1,base);try{
 for(const n of [0,1]){startLearning(db,day(n));answer(db,n)}
 for(const n of [3,4]){startLearning(db,day(n));const c=nextLearning(db,day(n)).card!;expect(c.mode).toBe('dictation');deferLearning(db,c.issueId,day(n));}
 db.prepare('DELETE FROM learning_words WHERE word_id=1').run();db.prepare("UPDATE cards SET reps=1,due='2026-12-01T00:00:00.000Z' WHERE mode<>'dictation'").run();db.prepare("UPDATE learning_card_state SET delayed_successes=1,verification_due=NULL WHERE card_id IN (SELECT id FROM cards WHERE mode<>'dictation')").run();
 for(let i=2;i<=51;i++)db.prepare('INSERT INTO words(id,headword,meaning_zh,source,priority,freq_rank) VALUES (?,?,?,?,?,?)').run(i,'extra'+String.fromCharCode(65+i),`释义${i}`,'kb2022',1,i);
 startLearning(db,day(5));const rows=db.prepare('SELECT word_id FROM learning_day_words WHERE day=?').all('2026-10-26');expect(rows).toHaveLength(40);expect(rows).not.toContainEqual({word_id:1});
 }finally{db.close()}
});
it('a recognition pass during audio cooldown never creates listening evidence or mastery',async()=>{
 const {readWordEvidence}=await import('../server/src/learning/evidence-store');const db=makeV3Fixture(1,base);try{
 for(const n of [0,1]){startLearning(db,day(n));answer(db,n)}for(const n of [3,4]){startLearning(db,day(n));const c=nextLearning(db,day(n)).card!;expect(c.mode).toBe('dictation');deferLearning(db,c.issueId,day(n));}
 startLearning(db,day(5));const c=nextLearning(db,day(5)).card!;expect(c.mode).toBe('recognize');answer(db,5);expect(readWordEvidence(db,1,day(5)).stable).toBe(false);expect(db.prepare("SELECT COUNT(*) n FROM learning_events WHERE mode='dictation' AND kind='probe_success'").get()).toEqual({n:0});
 }finally{db.close()}
});
it.each([['probe_success','independent'],['probe_failure','wrong']] as const)('resets the technical backoff after a genuine listening %s', (kind,reason)=>{
 const db=makeV3Fixture(1,base);try{
  for(const n of [0,1]){startLearning(db,day(n));answer(db,n)}for(const n of [3,4]){startLearning(db,day(n));const c=nextLearning(db,day(n)).card!;expect(c.mode).toBe('dictation');deferLearning(db,c.issueId,day(n));}
  const insert=db.prepare("INSERT INTO learning_events(event_key,word_id,mode,kind,occurred_at,reason,source) VALUES (?,1,'dictation',?,?,?,'live')");insert.run('old-listening-outcome',kind,new Date(+day(4)+60000).toISOString(),reason);insert.run('fresh-technical','technical_defer',new Date(+day(4)+120000).toISOString(),'audio');
  startLearning(db,day(5));expect(nextLearning(db,day(5)).card?.mode).toBe('dictation');
 }finally{db.close()}
});
it('several audio-only failures record zero mistakes and leave space for forty other words',()=>{
 const db=makeV3Fixture(3,base);try{
  for(const n of [0,1]){startLearning(db,day(n));for(let i=0;i<3;i++){const c=nextLearning(db,day(n)).card!;db.prepare("UPDATE learning_issues SET mode='dictation' WHERE id=?").run(c.issueId);deferLearning(db,c.issueId,day(n));}expect(learningToday(db,day(n))).toMatchObject({deferred:3,attempts:0,correct:0});}
  db.prepare("UPDATE cards SET reps=1,due='2026-12-01T00:00:00.000Z' WHERE mode<>'dictation'").run();db.prepare("UPDATE learning_card_state SET delayed_successes=1,verification_due=NULL WHERE card_id IN (SELECT id FROM cards WHERE mode<>'dictation')").run();
  for(let i=4;i<=53;i++)db.prepare('INSERT INTO words(id,headword,meaning_zh,source,priority,freq_rank) VALUES (?,?,?,?,?,?)').run(i,'another'+String.fromCharCode(65+i),`释义${i}`,'kb2022',1,i);
  startLearning(db,day(2));const rows=db.prepare("SELECT word_id FROM learning_day_words WHERE day='2026-10-23'").all() as {word_id:number}[];expect(rows).toHaveLength(40);expect(rows.some(r=>r.word_id<=3)).toBe(false);expect(db.prepare('SELECT COUNT(*) n FROM review_logs').get()).toEqual({n:0});
 }finally{db.close()}
});
