import {expect,it} from 'vitest';
import {REVIEW_POLICY,classifyEvidence,chooseCapability} from '../server/src/learning/evidence-policy';
import type {CapabilityNeed,LearningMode} from '../shared/learning';
const base={correct:true,assisted:false,nowMs:60000,latestExposureMs:0,probeAlreadySaved:false};
it('does not turn helped or recent corrections into independent successes',()=>{
 expect(classifyEvidence(base,REVIEW_POLICY)).toMatchObject({kind:'correction',eligible:false,rating:null});
 expect(classifyEvidence({...base,assisted:true},REVIEW_POLICY)).toMatchObject({kind:'probe_failure',rating:1,reason:'help'});
 expect(classifyEvidence({...base,assisted:true,probeAlreadySaved:true},REVIEW_POLICY)).toMatchObject({kind:'correction',rating:null});
});
it.each([299999,300000])('enforces exposure guard at %i ms',nowMs=>expect(classifyEvidence({...base,nowMs},REVIEW_POLICY).rating).toBe(nowMs===300000?3:null));
it('accepts no-exposure recall and protects future exposures and recent wrong copies',()=>{
 expect(classifyEvidence({...base,latestExposureMs:null},REVIEW_POLICY).rating).toBe(3);
 expect(classifyEvidence({...base,latestExposureMs:90000},REVIEW_POLICY).rating).toBeNull();
 expect(classifyEvidence({...base,correct:false},REVIEW_POLICY).rating).toBeNull();
 expect(classifyEvidence({...base,correct:false,latestExposureMs:null},REVIEW_POLICY).rating).toBe(1);
});
const t=new Date('2026-10-21T01:00:00Z');
const need=(cardId:number,mode:LearningMode,dueAt='2026-10-20T00:00:00Z',group:CapabilityNeed['group']='due',lastAttemptAt:string|null=null):CapabilityNeed=>({cardId,mode,group,dueAt,eligibleAt:dueAt,lastAttemptAt});
it('does not hide an earlier listening need behind spelling priority',()=>expect(chooseCapability([need(1,'spell','2026-10-21T00:30:00Z'),need(2,'dictation')],t)?.mode).toBe('dictation'));
it('uses spelling only as a final due tie break',()=>expect(chooseCapability([need(1,'recognize'),need(2,'dictation'),need(3,'spell')],t)?.mode).toBe('spell'));
it('rotates missing evidence by oldest independent attempt before repeated failures',()=>expect(chooseCapability([need(1,'spell',undefined,'missing',t.toISOString()),need(2,'recognize',undefined,'missing')],t)?.mode).toBe('recognize'));
it('excludes future and protected needs and returns null for empty input',()=>{
 expect(chooseCapability([need(1,'spell','2027-01-01T00:00:00Z')],t)).toBeNull();expect(chooseCapability([],t)).toBeNull();
});
