import {afterEach,expect,it} from 'vitest';
import {makeV3Fixture,makeLegacyFixture} from './learning-v3-helpers';
import {ensureEvidenceWord,readWordEvidence,capabilityNeeds} from '../server/src/learning/evidence-store';
import {nextCard,queueState,wrongPractice,setWrong,checkSpelling} from '../server/src/study';
import {startLearning} from '../server/src/learning/engine';
import {hasOpenQuestion,answerQuestion} from '../server/src/quiz';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
import {hasDictionaryPlaceholder} from '../server/src/text';
import type {DB} from '../server/src/db';
const now=new Date('2026-10-21T01:00:00Z'),dbs:DB[]=[];afterEach(()=>dbs.splice(0).forEach(d=>d.close()));
it('limits only the explicitly identified skeletons without changing other phrases',()=>{
 for(const w of ['leave ... alone','take for granted','prefer ... to ...'])expect(hasDictionaryPlaceholder(w)).toBe(true);
 for(const w of ['at last','take notes','look forward to','what if','prefer'])expect(hasDictionaryPlaceholder(w)).toBe(false);
});
it('ignores obsolete spelling failures without removing history or awarding full mastery',()=>{
 const db=makeV3Fixture();dbs.push(db);db.prepare("UPDATE words SET headword='owe sth. to sb.' WHERE id=1").run();ensureEvidenceWord(db,1,now);
 db.prepare("UPDATE cards SET reps=3,scheduled_days=30 WHERE word_id=1 AND mode='recognize'").run();
 db.prepare("UPDATE learning_card_state SET delayed_successes=2,recovery_days='[\"2026-10-19\",\"2026-10-20\"]' WHERE card_id=(SELECT id FROM cards WHERE word_id=1 AND mode='recognize')").run();
 db.prepare("UPDATE learning_card_state SET last_failure_at='2026-10-20T01:00:00Z' WHERE card_id=(SELECT id FROM cards WHERE word_id=1 AND mode='spell')").run();
 expect(readWordEvidence(db,1,now)).toMatchObject({priority:false,stable:false,weakModes:[]});expect(capabilityNeeds(db,1,now).map(c=>c.mode)).toEqual(['recognize']);
 expect((db.prepare("SELECT last_failure_at FROM learning_card_state WHERE card_id=(SELECT id FROM cards WHERE word_id=1 AND mode='spell')").get() as any).last_failure_at).not.toBeNull();
});
it('does not block recognition with an obsolete open audio question or accept its answer',()=>{
 const db=makeLegacyFixture();dbs.push(db);db.prepare("UPDATE words SET headword='owe sth. to sb.' WHERE id=1").run();startLearning(db,now);
 const id=(db.prepare("SELECT id FROM cards WHERE mode='recognize'").get() as any).id;
 db.prepare("INSERT INTO question_issues(card_id,qtype,context,options_json,answer_word_id,issued_at) VALUES (?,'listen_choice','practice','[1]',1,?)").run(id,now.toISOString());
 const issue=(db.prepare('SELECT id FROM question_issues').get() as any).id;
 expect(hasOpenQuestion(db,id,undefined,now)).toBe(false);expect(()=>answerQuestion(db,issue,1,'stale-choice',now)).toThrow();
});
it('legacy queue ignores prohibited due cards and old spelling submissions cannot create evidence',()=>{
 const db=makeLegacyFixture();dbs.push(db);db.prepare("UPDATE words SET headword='proceed to sth.' WHERE id=1").run();startLearning(db,now);
 db.prepare("UPDATE cards SET due='2026-10-20T00:00:00Z' WHERE mode='spell'").run();db.prepare("UPDATE cards SET due='2026-10-25T00:00:00Z' WHERE mode<>'spell'").run();
 expect(queueState(db,now).review).toBe(0);expect((nextCard(db,now) as any)?.mode).not.toBe('spell');
 const id=(db.prepare("SELECT id FROM cards WHERE mode='spell'").get() as any).id;expect(()=>checkSpelling(db,id,'proceed to sth.',now)).toThrow();expect((db.prepare('SELECT count(*) n FROM review_logs').get() as any).n).toBe(0);
});
it('filters a textbook phrase skeleton from the legacy due queue',()=>{
 const db=makeLegacyFixture();dbs.push(db);db.prepare("UPDATE words SET headword='take for granted' WHERE id=1").run();startLearning(db,now);
 db.prepare("UPDATE cards SET due='2026-10-20T00:00:00Z' WHERE mode='dictation'").run();db.prepare("UPDATE cards SET due='2026-10-25T00:00:00Z' WHERE mode<>'dictation'").run();
 expect(queueState(db,now).review).toBe(0);const id=(db.prepare("SELECT id FROM cards WHERE mode='dictation'").get() as any).id;
 expect(()=>checkSpelling(db,id,'take for granted',now)).toThrow();
});
it('legacy wrong practice never selects previously failed spelling or audio for placeholder terms',()=>{
 const db=makeLegacyFixture();dbs.push(db);db.prepare("UPDATE words SET headword='owe sth. to sb.' WHERE id=1").run();startLearning(db,now);
 db.prepare("UPDATE cards SET state=2 WHERE mode='recognize'").run();const id=(db.prepare("SELECT id FROM cards WHERE mode='spell'").get() as any).id;
 db.prepare("INSERT INTO review_logs(card_id,rating,state,due,stability,difficulty,elapsed_days,scheduled_days,review_at,correct,qtype) SELECT id,1,state,due,stability,difficulty,0,0,?,0,'spell' FROM cards WHERE id=?").run(now.toISOString(),id);
 setWrong(db,1,true,now);const item=wrongPractice(db,10,now,()=>0).items[0];expect(item.card.mode).toBe('recognize');expect(item.question?.qtype).not.toBe('listen_choice');
});
it('keeps disabled historical failures out of current priority after offline export and reopen',async()=>{
 const source=makeV3Fixture();source.prepare("UPDATE words SET headword='owe sth. to sb.' WHERE id=1").run();ensureEvidenceWord(source,1,now);
 source.prepare("UPDATE cards SET reps=1 WHERE mode='recognize'").run();
 source.prepare("UPDATE learning_card_state SET last_failure_at='2026-10-20T01:00:00Z' WHERE card_id=(SELECT id FROM cards WHERE mode='spell')").run();
 const mobile=await openBrowserDatabase(source.serialize());source.close();try{const db=asSharedDb(mobile);expect(readWordEvidence(db,1,now).priority).toBe(false);expect(capabilityNeeds(db,1,now).map(n=>n.mode)).toEqual(['recognize']);
 const restored=await openBrowserDatabase(mobile.export());try{expect(readWordEvidence(asSharedDb(restored),1,now).priority).toBe(false);}finally{restored.close();}}finally{mobile.close();}
});
