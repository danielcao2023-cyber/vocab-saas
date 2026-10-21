import {afterEach,expect,it} from 'vitest';
import {makeV3Fixture} from './learning-v3-helpers';
import {startLearning,nextLearning,consultLearning,answerLearning} from '../server/src/learning/engine';
import {learningViews} from '../server/src/learning/evidence-views';
import {wordDetail,search,browse} from '../server/src/search';
import {buildApp} from '../server/src/app';
import type {DB} from '../server/src/db';
const t=new Date('2026-10-21T01:00:00Z'),dbs:DB[]=[];afterEach(()=>dbs.splice(0).forEach(d=>d.close()));
function fixture(){const db=makeV3Fixture(2,t);dbs.push(db);return db;}
it('allows overlapping due/priority and projects the same evidence on word/search/browse',()=>{
 const db=fixture();startLearning(db,t);const c=nextLearning(db,t).card!;consultLearning(db,{policyVersion:3,issueId:c.issueId,eventId:'help'},t);
 const later=new Date(+t+300000);expect(learningViews(db,'priority',1,later).total).toBe(1);expect(learningViews(db,'due',1,later).total).toBe(1);expect(learningViews(db,'stable',1,later).total).toBe(0);
 const detail=wordDetail(db,c.wordId) as any;expect(detail.evidenceState.priority).toBe(true);expect(search(db,'experience')[0].evidenceState).toEqual(detail.evidenceState);expect(browse(db,{}).items.find(w=>w.id===c.wordId)?.evidenceState).toEqual(detail.evidenceState);
});
it('guards legacy write routes and validates evidence input rather than accepting client ratings',async()=>{
 const db=fixture(),app=buildApp(db,{now:()=>t});try{
  for(const url of ['/api/review','/api/check','/api/answer'])expect((await app.inject({method:'POST',url,payload:{}})).statusCode).toBe(409);
  expect((await app.inject('/api/learning/views?view=bad')).statusCode).toBe(400);
  expect((await app.inject({method:'POST',url:'/api/learning/exposure',payload:{policyVersion:3,wordId:1,eventId:'x',reason:'lesson',rating:3}})).statusCode).toBe(400);
  expect((await app.inject({method:'POST',url:'/api/learning/start',payload:{policyVersion:3}})).statusCode).toBe(200);
  const c=(await app.inject('/api/learning/next')).json().card;
  expect((await app.inject({method:'POST',url:'/api/learning/consult',payload:{policyVersion:3,issueId:c.issueId,eventId:'read'}})).statusCode).toBe(200);
 }finally{await app.close();}
});
