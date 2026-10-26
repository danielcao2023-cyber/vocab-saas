import {expect,it} from 'vitest';
import {buildApp} from '../server/src/app';
import {makeV3Fixture} from './learning-v3-helpers';
import {startLearning,learningToday} from '../server/src/learning/engine';
import {openBrowserDatabase} from '../web/src/offline/sqlite';
import {createLocalRuntime} from '../web/src/offline/runtime';
const t=new Date('2026-10-26T01:00:00Z');
const preferences={dailyWordLimit:20,playbackRate:0.75,dictationAutoPlay:false};

it('returns only public preferences and applies daily volume tomorrow without changing today or reviews',async()=>{
 const db=makeV3Fixture(100,t);let now=t;const app=buildApp(db,{now:()=>now});
 db.prepare("INSERT INTO settings(key,value) VALUES ('private-marker','never-expose-this')").run();
 try{
  const before=await app.inject('/api/settings');expect(before.statusCode).toBe(200);expect(before.json().preferences).toEqual({dailyWordLimit:40,playbackRate:1,dictationAutoPlay:true});expect(before.body).not.toContain('never-expose-this');
  startLearning(db,t);const ids=db.prepare('SELECT word_id FROM learning_day_words').all();
  const saved=await app.inject({method:'POST',url:'/api/settings',payload:preferences});expect(saved.statusCode).toBe(200);expect(saved.json()).toMatchObject({preferences,activeDailyWordLimit:40,dailyLimitEffectiveOn:'2026-10-27'});
  expect(learningToday(db,t).total).toBe(40);expect(db.prepare('SELECT word_id FROM learning_day_words').all()).toEqual(ids);
  now=new Date(+t+86400000);expect(learningToday(db,now).total).toBe(20);startLearning(db,now);expect(learningToday(db,now).total).toBe(20);
  expect(db.prepare('SELECT COUNT(*) n FROM review_logs').get()).toEqual({n:0});
 }finally{await app.close();db.close();}
});

it('rejects unknown fields, invalid ranges and cross-origin changes atomically',async()=>{
 const db=makeV3Fixture(1,t),app=buildApp(db,{now:()=>t});
 try{
  for(const patch of [{dailyWordLimit:0},{dailyWordLimit:1000},{dailyWordLimit:20.5},{playbackRate:4},{dictationAutoPlay:'false'},{apiKey:'not-allowed'}])expect((await app.inject({method:'POST',url:'/api/settings',payload:{...preferences,...patch}})).statusCode).toBe(400);
  expect((await app.inject({method:'POST',url:'/api/settings',headers:{origin:'https://unrelated.example'},payload:preferences})).statusCode).toBe(403);
  expect((await app.inject('/api/settings')).json().preferences.dailyWordLimit).toBe(40);
 }finally{await app.close();db.close();}
});

it('does not postpone tomorrow when only audio settings are saved again, and can cancel a pending goal',async()=>{
 const db=makeV3Fixture(100,t);let now=t;const app=buildApp(db,{now:()=>now});
 const save=(body:any)=>app.inject({method:'POST',url:'/api/settings',payload:body});
 try{
  await save(preferences);now=new Date(+t+3600000);
  expect((await save({...preferences,playbackRate:1.25})).json().dailyLimitEffectiveOn).toBe('2026-10-27');
  await save({...preferences,dailyWordLimit:40});now=new Date(+t+86400000);expect(learningToday(db,now).total).toBe(40);
 }finally{await app.close();db.close();}
});

it('keeps an offline settings write retryable and restores it from the saved snapshot',async()=>{
 const source=makeV3Fixture(60,t),db=await openBrowserDatabase(source.serialize());source.close();let fail=true,image:Uint8Array|undefined;
 const r=createLocalRuntime({db,now:()=>t,recordings:{},assetFetch:fetch,save:async bytes=>{if(fail)throw Error('disk full');image=bytes;}});
 const post=()=>r.fetch('/api/settings',{method:'POST',body:JSON.stringify(preferences)});
 try{
  expect((await post()).status).toBe(503);fail=false;expect((await post()).status).toBe(200);
  const restored=await openBrowserDatabase(image!);try{const reopened=createLocalRuntime({db:restored,now:()=>t,recordings:{},assetFetch:fetch,save:async()=>{}});expect((await(await reopened.fetch('/api/settings')).json()).preferences).toEqual(preferences);}finally{restored.close();}
 }finally{db.close();}
});
