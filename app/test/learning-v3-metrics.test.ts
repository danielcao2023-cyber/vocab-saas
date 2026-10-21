import {expect,it} from 'vitest';
import {makeV3Fixture} from './learning-v3-helpers';
import {startLearning,nextLearning,answerLearning,consultLearning} from '../server/src/learning/engine';
import {evidenceMetrics} from '../server/src/learning/evidence-views';
const t=new Date('2026-10-21T01:00:00Z');
it('keeps helped first attempts failed after correction and excludes copies from the denominator',()=>{
 const db=makeV3Fixture(1,t);try{
 startLearning(db,t);const c=nextLearning(db,t).card!;consultLearning(db,{policyVersion:3,issueId:c.issueId,eventId:'help'},t);
 answerLearning(db,{policyVersion:3,issueId:c.issueId,answerId:'copy',answer:'experience'},t);
 const later=new Date(+t+300000),d=nextLearning(db,later).card!;answerLearning(db,{policyVersion:3,issueId:d.issueId,answerId:'recall',answer:'experience'},later);
 expect(evidenceMetrics(db,later).modes.spell).toMatchObject({samples:1,successes:0,accuracy:0,helpRate:1,delayedSamples:0,delayedAccuracy:null});
 expect(evidenceMetrics(db,later).modes.dictation).toMatchObject({samples:0,accuracy:null});
 }finally{db.close();}
});
