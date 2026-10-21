import {review} from '../server/src/study';
import {Rating} from 'ts-fsrs';
import {upsertWords} from '../server/src/import';
import {recomputeDailyStats} from '../server/src/stats';
import {afterEach,expect,it} from 'vitest';
import {makeLegacyFixture} from './learning-v3-helpers';
import {activateEvidencePolicy,evidenceVersion} from '../server/src/learning/evidence-migration';
import {startLearning,nextLearning,consultLearning,answerLearning} from '../server/src/learning/engine';
import type {DB} from '../server/src/db';
const dbs:DB[]=[];afterEach(()=>dbs.splice(0).forEach(d=>d.close()));
function fixture(){const d=makeLegacyFixture(2);dbs.push(d);return d;}
const t=new Date('2026-10-21T01:00:00Z');
it('preserves raw logs/results and frozen words while conservatively importing known help',()=>{
 const db=fixture();startLearning(db,t);const a=nextLearning(db,t);consultLearning(db,a.card!.issueId,t);
 answerLearning(db,{issueId:a.card!.issueId,answerId:'old',choiceId:a.card!.wordId,answer:'experience'},t);
 const logs=db.prepare('SELECT * FROM review_logs').all(),issues=db.prepare('SELECT result_json FROM learning_issues WHERE answer_id IS NOT NULL').all(),ids=db.prepare('SELECT word_id FROM learning_day_words').all();
 const report=activateEvidencePolicy(db,t);expect(report.verifiedEvents).toBeGreaterThan(0);expect(evidenceVersion(db)).toBe(3);
 expect(db.prepare('SELECT * FROM review_logs').all()).toEqual(logs);expect(db.prepare('SELECT result_json FROM learning_issues WHERE answer_id IS NOT NULL').all()).toEqual(issues);expect(db.prepare('SELECT word_id FROM learning_day_words').all()).toEqual(ids);
 expect(db.prepare("SELECT COUNT(*) n FROM learning_events WHERE kind='probe_success'").get()).toEqual({n:0});
 const events=db.prepare('SELECT * FROM learning_events').all();activateEvidencePolicy(db,t);expect(db.prepare('SELECT * FROM learning_events').all()).toEqual(events);
});
it('activates fresh and legacy-only databases without inventing successes',()=>{
 const db=fixture();activateEvidencePolicy(db,t);expect(evidenceVersion(db)).toBe(3);expect(db.prepare('SELECT COUNT(*) n FROM learning_events').get()).toEqual({n:0});
});
it('rolls back snapshots and metadata if activation fails halfway',()=>{
 const db=fixture();startLearning(db,t);const before=db.prepare('SELECT * FROM cards').all();
 db.exec("CREATE TRIGGER fail_v3 BEFORE INSERT ON learning_v3_snapshots BEGIN SELECT RAISE(ABORT,'injected'); END");
 expect(()=>activateEvidencePolicy(db,t)).toThrow('injected');expect(evidenceVersion(db)).toBe(2);expect(db.prepare('SELECT * FROM cards').all()).toEqual(before);expect(db.prepare('SELECT COUNT(*) n FROM learning_v3_snapshots').get()).toEqual({n:0});
});
it('keeps orphan legacy ratings unknown and preserves their original intervals',()=>{
 const db=fixture();startLearning(db,t);const c=db.prepare("SELECT * FROM cards WHERE mode='spell' LIMIT 1").get() as any;
 review(db,c.id,Rating.Hard,t,{answerId:'orphan'});const before=db.prepare('SELECT * FROM cards WHERE id=?').get(c.id);activateEvidencePolicy(db,t);
 expect(db.prepare('SELECT * FROM cards WHERE id=?').get(c.id)).toEqual(before);expect(db.prepare("SELECT COUNT(*) n FROM learning_events WHERE kind='probe_success' OR kind='probe_failure'").get()).toEqual({n:0});expect(db.prepare('SELECT verification_required FROM learning_card_state WHERE card_id=?').get(c.id)).toEqual({verification_required:1});
});
it('clears v3 sample state without leaving foreign keys or snapshots to removed words',()=>{
 const db=fixture();db.exec("UPDATE words SET source='sample',is_sample=1");startLearning(db,t);const c=nextLearning(db,t).card!;consultLearning(db,c.issueId,t);activateEvidencePolicy(db,t);
 expect(()=>upsertWords(db,[{headword:'apple',level:'三级',pos:null}],new Map(),'kb2022',false,{clearSample:true})).not.toThrow();expect(db.pragma('foreign_key_check')).toEqual([]);expect(db.prepare('SELECT COUNT(*) n FROM learning_events').get()).toEqual({n:0});expect(db.prepare('SELECT COUNT(*) n FROM learning_v3_snapshots').get()).toEqual({n:0});
});
it('retains historical daily rows after activation and subsequent recomputation',()=>{
 const db=fixture(),yesterday=new Date(+t-86400000);startLearning(db,yesterday);const c=nextLearning(db,yesterday).card!;answerLearning(db,{issueId:c.issueId,answerId:'old-day',choiceId:c.wordId,answer:'experience'},yesterday);
 const old=db.prepare('SELECT * FROM daily_stats WHERE day=?').get('2026-10-20');activateEvidencePolicy(db,t);recomputeDailyStats(db);expect(db.prepare('SELECT * FROM daily_stats WHERE day=?').get('2026-10-20')).toEqual(old);
});
