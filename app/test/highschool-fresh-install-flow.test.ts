import {expect,it} from 'vitest';
import fs from 'node:fs';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import {activateEvidencePolicy} from '../server/src/learning/evidence-migration';
import {openBrowserDatabase} from '../web/src/offline/sqlite';
import {createLocalRuntime} from '../web/src/offline/runtime';

it('uses a selected actual textbook unit in a fresh catalog-only offline install',async()=>{
 const now=new Date('2026-10-29T01:00:00Z');let current=now;const catalog=JSON.parse(fs.readFileSync('data/vocabulary/catalog.json','utf8'));
 const book='pep2019-compulsory-1',unit='pep2019-compulsory-1:unit1';const scoped={...catalog,books:catalog.books.filter((b:any)=>b.id===book),units:catalog.units.filter((u:any)=>u.bookId===book),entries:catalog.entries.map((e:any)=>({...e,memberships:e.memberships.filter((m:any)=>m.bookId===book&&m.unitId===unit)})).filter((e:any)=>e.memberships.length)};
 const source=openDb(':memory:');installVocabulary(source,scoped);activateEvidencePolicy(source,now);expect(source.prepare("SELECT COUNT(*) n FROM words WHERE source='kb2022'").get()).toEqual({n:0});let bytes:Uint8Array=source.serialize();source.close();
 let db=await openBrowserDatabase(bytes);const create=()=>createLocalRuntime({db,save:async b=>{bytes=b;},assetFetch:async()=>new Response('',{status:404}),recordings:{},now:()=>current});let runtime=create();
 const request=async(path:string,body?:any)=>{const response=await runtime.fetch(path,body?{method:'POST',body:JSON.stringify(body)}:undefined);expect(response.status,`${path}: ${await response.clone().text()}`).toBe(200);return response.json();};
 try{
  const s=await request('/api/settings',{dailyWordLimit:40,playbackRate:1,dictationAutoPlay:true,vocabulary:{bookId:book,unitId:unit}});expect(s.vocabulary.activeSelection.unitId).toBe(unit);
  const summary=await request('/api/learning/start',{policyVersion:3});expect(summary.total).toBeGreaterThan(0);expect(summary.total).toBeLessThanOrEqual(40);
  const scope=new Set((db.prepare('SELECT word_id FROM vocabulary_members WHERE unit_id=?').all(unit) as {word_id:number}[]).map(x=>x.word_id));const planned=(db.prepare('SELECT word_id FROM learning_day_words').all() as {word_id:number}[]).map(x=>x.word_id);expect(planned.every(id=>scope.has(id))).toBe(true);
  let recognize=0,answered=0;const answeredIds:number[]=[];for(let i=0;i<Math.max(0,summary.total-1);i++){
   const turn=await request('/api/learning/next');if(turn.kind!=='card')break;const card=turn.card;const word=db.prepare('SELECT headword FROM words WHERE id=?').get(card.wordId) as {headword:string};
   if(card.mode==='recognize'){recognize++;expect(card.options.some((o:any)=>o.id===card.wordId&&o.text)).toBe(true);expect(card.options.some((o:any)=>o.id!==0&&o.id!==card.wordId&&o.text)).toBe(true);}
   const result=await request('/api/learning/answer',{policyVersion:3,issueId:card.issueId,answerId:`fresh-${i}`,...(card.mode==='recognize'?{choiceId:card.wordId}:{answer:word.headword})});expect(result.correct).toBe(true);answered++;answeredIds.push(card.wordId);
  }
  expect(answered).toBeGreaterThan(0);const pending=await request('/api/learning/next');expect(pending.kind).toBe('card');const prior=pending.card;
  db.close();db=await openBrowserDatabase(bytes);runtime=create();expect((await request('/api/learning/next')).card).toEqual(prior);
  current=new Date(+now+86400000);const next=await request('/api/learning/start',{policyVersion:3});expect(next.total).toBeGreaterThan(0);const tomorrow=(db.prepare("SELECT word_id FROM learning_day_words WHERE day='2026-10-30'").all() as {word_id:number}[]).map(x=>x.word_id);expect(tomorrow.every(id=>scope.has(id))).toBe(true);expect(tomorrow).toContain(prior.wordId);expect(tomorrow.some(id=>answeredIds.includes(id))).toBe(true);expect(recognize).toBeGreaterThan(0);
 }finally{db.close();}
});
