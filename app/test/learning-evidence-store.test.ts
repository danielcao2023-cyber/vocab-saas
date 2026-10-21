import {afterEach,expect,it} from 'vitest';
import {makeV3Fixture} from './learning-v3-helpers';
import {ensureEvidenceWord,saveProbe,saveExposure,readWordEvidence} from '../server/src/learning/evidence-store';
import type {DB} from '../server/src/db';
const dbs:DB[]=[];afterEach(()=>dbs.splice(0).forEach(d=>d.close()));const t=new Date('2026-10-21T01:00:00Z');
function fixture(){const db=makeV3Fixture();dbs.push(db);ensureEvidenceWord(db,1,t);db.prepare("INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at) VALUES ('i','2026-10-21',1,'spell','[]',?)").run(t.toISOString());return db;}
it('saves help only once and corrections never schedule or graduate wrong words',()=>{
 const db=fixture(),failure={kind:'probe_failure',eligible:true,rating:1,reason:'help'} as const;
 expect(saveProbe(db,'i',failure,t).applied).toBe(true);expect(saveProbe(db,'i',failure,t).applied).toBe(false);
 saveProbe(db,'i',{kind:'correction',eligible:false,rating:null,reason:'already_recorded'},t);
 expect(db.prepare('SELECT rating FROM review_logs').all()).toEqual([{rating:1}]);expect(db.prepare('SELECT reps FROM cards WHERE mode=\'spell\'').get()).toEqual({reps:1});
 expect(readWordEvidence(db,1,t)).toMatchObject({priority:true,stable:false,stage:'consolidating'});
});
it('shares exposure across capabilities and refuses reused event IDs with different ownership',()=>{
 const db=fixture();saveExposure(db,{wordId:1,eventId:'visit',reason:'lesson'},t);saveExposure(db,{wordId:1,eventId:'visit',reason:'lesson'},t);
 expect(db.prepare("SELECT COUNT(*) n FROM learning_events WHERE kind='exposure'").get()).toEqual({n:1});
 expect(()=>saveExposure(db,{wordId:2,eventId:'visit',reason:'lesson'},t)).toThrow();
});
it('cannot turn a short successful retry into delayed recovery',()=>{
 const db=fixture();saveProbe(db,'i',{kind:'probe_failure',eligible:true,rating:1,reason:'wrong'},t);
 db.prepare("INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at) VALUES ('j','2026-10-21',1,'spell','[]',?)").run(new Date(+t+300000).toISOString());
 saveProbe(db,'j',{kind:'probe_success',eligible:true,rating:3,reason:'independent'},new Date(+t+300000));
 expect(readWordEvidence(db,1,new Date(+t+300000))).toMatchObject({priority:true,stable:false,stage:'consolidating'});
 expect(db.prepare('SELECT delayed_successes FROM learning_card_state s JOIN cards c ON c.id=s.card_id WHERE mode=\'spell\'').get()).toEqual({delayed_successes:0});
});
it('requires two delayed success days after the capability failure before leaving priority',()=>{
 const db=fixture();saveProbe(db,'i',{kind:'probe_failure',eligible:true,rating:1,reason:'help'},t);
 for(let day=1;day<=2;day++){const now=new Date(+t+day*86400000),id='day'+day;db.prepare("INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at) VALUES (?,?,1,'spell','[]',?)").run(id,'2026-10-'+(21+day),now.toISOString());saveProbe(db,id,{kind:'probe_success',eligible:true,rating:3,reason:'independent'},now);expect(readWordEvidence(db,1,now)).toMatchObject({priority:day===1,stable:false,stage:'review'});}
});
