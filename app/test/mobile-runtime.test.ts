import {expect,it,vi} from 'vitest';
import {database,T} from './v3-helpers';
import {openBrowserDatabase} from '../web/src/offline/sqlite';
import {createLocalRuntime} from '../web/src/offline/runtime';
import type {LearningTurn} from '../shared/learning';
const get=(runtime:ReturnType<typeof createLocalRuntime>,path:string)=>runtime.fetch(path);
const post=(runtime:ReturnType<typeof createLocalRuntime>,path:string,body:unknown)=>runtime.fetch(path,{method:'POST',body:JSON.stringify(body)});
async function fixture(){const source=database(60);try{return await openBrowserDatabase(source.serialize());}finally{source.close();}}

it('starts empty on-device and uses the shared daily plan without network service calls',async()=>{
 const db=await fixture(),save=vi.fn(async()=>{}),assets=vi.fn();
 try{
  const runtime=createLocalRuntime({db,save,recordings:{},assetFetch:assets,now:()=>T});
  const fresh=await (await get(runtime,'/api/learning/today')).json();
  expect(fresh.books).toEqual({new:60,unfamiliar:0,familiar:0,mastered:0});expect(fresh.completed).toBe(0);expect(fresh.started).toBe(false);
  const started=await (await post(runtime,'/api/learning/start',{})).json();expect(started.total).toBe(40);
  expect((await (await get(runtime,'/api/learning/next')).json()).kind).toBe('card');
  expect(assets).not.toHaveBeenCalled();expect(save).toHaveBeenCalled();
 }finally{db.close();}
});

it('does not acknowledge an answer until persistence succeeds, and a retry is exactly once across reopening',async()=>{
 const db=await fixture();let image:Uint8Array|undefined;const save=vi.fn(async(bytes:Uint8Array)=>{image=bytes;});
 try{
  const runtime=createLocalRuntime({db,save,recordings:{},assetFetch:vi.fn(),now:()=>T});
  await post(runtime,'/api/learning/start',{});const turn=await (await get(runtime,'/api/learning/next')).json() as LearningTurn;
  if(turn.kind!=='card'||!turn.card)throw new Error('fixture has no card');
  const card=turn.card,body={issueId:card.issueId,answerId:'persisted-answer',choiceId:card.wordId,answer:db.prepare('SELECT headword FROM words WHERE id=?').get(card.wordId)?.headword};
  save.mockRejectedValueOnce(new Error('disk full'));
  expect((await post(runtime,'/api/learning/answer',body)).status).toBe(503);
  expect((await post(runtime,'/api/learning/answer',body)).status).toBe(200);
  const restored=await openBrowserDatabase(image!);
  try{
   const reopened=createLocalRuntime({db:restored,save:async()=>{},recordings:{},assetFetch:vi.fn(),now:()=>T});
   const summary=await (await get(reopened,'/api/learning/today')).json();expect(summary.completed).toBe(1);expect(summary.answers).toBe(1);
   expect((await post(reopened,'/api/learning/answer',body)).status).toBe(200);
   expect((await (await get(reopened,'/api/learning/today')).json()).answers).toBe(1);
  }finally{restored.close();}
 }finally{db.close();}
});

it('loads only the matching bundled lesson and returns metadata without an external fetch',async()=>{
 const db=await fixture(),assets=vi.fn(async()=>Response.json({wordId:1,headword:'word1',headline:'local lesson'}));
 try{
  const runtime=createLocalRuntime({db,save:async()=>{},assetFetch:assets,recordings:{word1:{word:'word1',file:'/offline/recordings/word1.mp3',accent:'us',sourceUrl:'https://example.com/source',author:'author',license:'CC BY',licenseUrl:'https://example.com/license'}},now:()=>T});
  expect((await (await get(runtime,'/api/word/1/lesson')).json()).lesson.headline).toBe('local lesson');
  expect(assets).toHaveBeenCalledWith('/offline/lessons/1.json');
  expect((await (await get(runtime,'/api/pronunciation?word=word1')).json()).status).toBe('ready');expect(assets).toHaveBeenCalledTimes(1);
  assets.mockImplementationOnce(async()=>Response.json({wordId:2,headword:'word2'}));expect((await get(runtime,'/api/word/1/lesson')).status).toBe(503);
 }finally{db.close();}
});
