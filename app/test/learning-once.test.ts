import {afterEach,expect,it} from 'vitest';
import {openDb,type DB} from '../server/src/db';
import {startLearning,nextLearning,answerLearning,learningToday,learningBooks,consultLearning} from '../server/src/learning/engine';
const dbs:DB[]=[];afterEach(()=>dbs.splice(0).forEach(db=>db.close()));
const initial=new Date('2026-10-20T09:00:00+08:00');
function fixture(n=40){const db=openDb(':memory:');dbs.push(db);for(let i=1;i<=n;i++)db.prepare('INSERT INTO words(id,headword,meaning_zh,source,level,priority) VALUES (?,?,?,?,?,?)').run(i,'word'+String.fromCharCode(97+i%26)+String.fromCharCode(97+Math.floor(i/26)),'释义'+i,'kb2022','三级',2);return db;}
function answer(db:DB,turn:any,now=initial,correct=true,id=crypto.randomUUID()){const c=turn.card;return answerLearning(db,{issueId:c.issueId,answerId:id,...(c.mode==='recognize'?{choiceId:correct?c.wordId:0}:{answer:correct?(db.prepare('SELECT headword FROM words WHERE id=?').get(c.wordId) as any).headword:'wrong'})},now);}
it('mixes all three modes from the start and completes forty new words with forty clean answers',()=>{
 const db=fixture();startLearning(db,initial);const modes:string[]=[],ids:number[]=[];
 for(let i=0;i<40;i++){const t=nextLearning(db,initial);expect(t.kind).toBe('card');modes.push(t.card!.mode);ids.push(t.card!.wordId);answer(db,t);}
 expect(new Set(modes.slice(0,6)).size).toBe(3);expect(new Set(ids).size).toBe(40);expect(nextLearning(db,initial).kind).toBe('done');expect(learningToday(db,initial)).toMatchObject({completed:40,answers:40});expect(learningBooks(db,'familiar').total).toBe(40);
});
it('puts a failed word behind other words and retires it after one independent correct answer without a timed wait',()=>{
 const db=fixture(3);startLearning(db,initial);const t=nextLearning(db,initial),word=t.card!.wordId;answer(db,t,initial,false);
 for(let i=0;i<2;i++){const t=nextLearning(db,initial);expect(t.kind).toBe('card');expect(t.card!.wordId).not.toBe(word);answer(db,t);}
 const retry=nextLearning(db,initial);expect(retry.card!.wordId).toBe(word);answer(db,retry);expect(nextLearning(db,initial).kind).toBe('done');expect(learningBooks(db,'familiar').total).toBe(3);
});
it('requires cross-day clean checks covering the three modes before promoting a new word to mastered',()=>{
 const db=fixture(1),modes=new Set<string>();
 for(let day=0;day<3;day++){const now=new Date(initial.getTime()+day*86400000);startLearning(db,now);const t=nextLearning(db,now);modes.add(t.card!.mode);answer(db,t,now);expect(nextLearning(db,now).kind).toBe('done');expect(learningBooks(db,'mastered').total).toBe(day===2?1:0);}
 expect(modes.size).toBe(3);
});
it('converts an already answered old nine-test plan without adding logs or replaying passed words',()=>{
 const db=fixture(1);startLearning(db,initial);answer(db,nextLearning(db,initial));
 db.prepare("UPDATE learning_days SET policy_version=1").run();db.prepare("UPDATE learning_day_words SET done=0,targets='[3,3,3]',streaks='[1,0,0]'").run();db.prepare("UPDATE learning_words SET book='unfamiliar',initial_done=0").run();
 db.prepare("INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at) VALUES ('old-open','2026-10-20',1,'spell','[]',?)").run(initial.toISOString());
 expect(startLearning(db,initial)).toMatchObject({completed:1,answers:1});expect(nextLearning(db,initial).kind).toBe('done');expect(learningBooks(db,'familiar').total).toBe(1);expect(db.prepare('SELECT COUNT(*) n FROM review_logs').get()).toEqual({n:1});
});
it('keeps assisted attempts pending but does not impose a minute-based wait',()=>{
 const db=fixture(1);startLearning(db,initial);const t=nextLearning(db,initial);consultLearning(db,t.card!.issueId,initial);answer(db,t);expect(learningToday(db,initial).completed).toBe(0);const retry=nextLearning(db,initial);expect(retry.kind).toBe('card');answer(db,retry);expect(nextLearning(db,initial).kind).toBe('done');expect(learningBooks(db,'mastered').total).toBe(0);
});
it('counts an old audio-deferred word as completed when an earlier independent answer already passed',()=>{
 const db=fixture(1);startLearning(db,initial);answer(db,nextLearning(db,initial));
 db.prepare('UPDATE learning_days SET policy_version=1').run();db.prepare("UPDATE learning_day_words SET done=0,deferred=1,targets='[3,3,3]'").run();db.prepare("UPDATE learning_words SET book='unfamiliar',initial_done=0").run();
 expect(startLearning(db,initial)).toMatchObject({completed:1,deferred:0,answers:1});expect(learningBooks(db,'familiar').total).toBe(1);expect(db.prepare('SELECT COUNT(*) n FROM review_logs').get()).toEqual({n:1});
});
