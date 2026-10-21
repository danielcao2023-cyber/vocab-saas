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
