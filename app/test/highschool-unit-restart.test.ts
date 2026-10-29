import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary,type Catalog} from '../server/src/vocabulary-import';
import {activateEvidencePolicy} from '../server/src/learning/evidence-migration';
import {saveVocabularySelection} from '../server/src/vocabulary-selection';
import {openBrowserDatabase} from '../web/src/offline/sqlite';
import {createLocalRuntime} from '../web/src/offline/runtime';
const t=new Date('2026-10-29T01:00:00Z');
const catalog:Catalog={version:1,books:[{id:'high',title:'高中',category:'high',edition:'2019',sourceUrl:'https://book.pep.com.cn/'}],units:[{id:'u1',bookId:'high',title:'Unit 1',position:1},{id:'u2',bookId:'high',title:'Unit 2',position:2}],entries:[{key:'shared',headword:'shared',meaning:'共同',memberships:[{bookId:'high',unitId:'u1',position:0},{bookId:'high',unitId:'u2',position:0}]},{key:'unitone',headword:'unitone',meaning:'第一单元',memberships:[{bookId:'high',unitId:'u1',position:1}]},{key:'unittwo',headword:'unittwo',meaning:'第二单元',memberships:[{bookId:'high',unitId:'u2',position:1}]}]};
it('keeps today’s unfinished plan across restart and restricts tomorrow reviews to the selected unit',async()=>{
 const node=openDb(':memory:');node.prepare("INSERT INTO words(headword,source) VALUES ('core','kb2022')").run();installVocabulary(node,catalog);activateEvidencePolicy(node,t);saveVocabularySelection(node,{bookId:'high',unitId:'u1'},t);let bytes:Uint8Array=node.serialize();node.close();let now=t;
 let db=await openBrowserDatabase(bytes);const create=()=>createLocalRuntime({db,save:async b=>{bytes=b;},assetFetch:async()=>new Response('',{status:404}),recordings:{},now:()=>now});let runtime=create();
 const req=async(path:string,body?:any)=>{const r=await runtime.fetch(path,body?{method:'POST',body:JSON.stringify(body)}:undefined);expect(r.status,`${path} ${await r.clone().text()}`).toBe(200);return r.json();};
 try{
  await req('/api/learning/start',{policyVersion:3});let turn=await req('/api/learning/next');expect(turn.card.headword??'').not.toBe('unittwo');const row=db.prepare('SELECT headword FROM words WHERE id=?').get(turn.card.wordId) as {headword:string};
  await req('/api/learning/answer',{policyVersion:3,issueId:turn.card.issueId,answerId:'answer-1',...(turn.card.mode==='recognize'?{choiceId:turn.card.wordId}:{answer:row.headword})});
  turn=await req('/api/learning/next');const open=turn.card;expect(open).toBeTruthy();
  const before=db.prepare('SELECT * FROM learning_day_words ORDER BY position').all();
  const settings=await req('/api/settings',{dailyWordLimit:40,playbackRate:1,dictationAutoPlay:true,vocabulary:{bookId:'high',unitId:'u2'}});expect(settings.vocabulary).toMatchObject({selection:{unitId:'u2'},activeSelection:{unitId:'u1'},effectiveOn:'2026-10-30'});
  db.close();db=await openBrowserDatabase(bytes);runtime=create();expect(db.prepare('SELECT * FROM learning_day_words ORDER BY position').all()).toEqual(before);expect((await req('/api/learning/next')).card).toEqual(open);
  now=new Date(+t+86400000);expect((await req('/api/vocabulary')).activeSelection.unitId).toBe('u2');await req('/api/learning/start',{policyVersion:3});
  const names=(db.prepare("SELECT w.headword FROM learning_day_words d JOIN words w ON w.id=d.word_id WHERE d.day='2026-10-30' ORDER BY w.headword").all() as {headword:string}[]).map(x=>x.headword);expect(names).toEqual(['shared','unittwo']);
  const old=await req('/api/settings',{dailyWordLimit:40,playbackRate:1,dictationAutoPlay:true,vocabulary:{bookId:'high',unitId:'u1'}});expect(old.vocabulary.effectiveOn).toBe('2026-10-31');
  db.close();db=await openBrowserDatabase(bytes);runtime=create();now=new Date(+t+2*86400000);await req('/api/learning/start',{policyVersion:3});
  const returned=(db.prepare("SELECT w.headword FROM learning_day_words d JOIN words w ON w.id=d.word_id WHERE d.day='2026-10-31'").all() as {headword:string}[]).map(x=>x.headword);expect(returned).toContain('unitone');expect(returned).not.toContain('unittwo');
 }finally{db.close();}
});
