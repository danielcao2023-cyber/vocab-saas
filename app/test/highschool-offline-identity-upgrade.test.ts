import {expect,it,vi} from 'vitest';
import fs from 'node:fs';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import {activateEvidencePolicy} from '../server/src/learning/evidence-migration';
import {saveVocabularySelection} from '../server/src/vocabulary-selection';
import {startLearning,nextLearning} from '../server/src/learning/engine';
import {openBrowserDatabase} from '../web/src/offline/sqlite';
import {createLocalRuntime,prepareVocabularyDatabase} from '../web/src/offline/runtime';

it('preserves an issued question, choices, history and lesson identity across offline catalog upgrade',async()=>{
 const t=new Date('2026-10-29T03:00:00Z');const catalog=JSON.parse(fs.readFileSync('data/vocabulary/catalog.json','utf8'));
 const book='pep2019-compulsory-1',unit='pep2019-compulsory-1:unit1';
 const entries=catalog.entries.filter((e:any)=>['sign up for sth.','title','teenage','teenager','volunteer'].includes(e.key)).map((e:any)=>({...e,memberships:e.memberships.filter((m:any)=>m.bookId===book&&m.unitId===unit)})).filter((e:any)=>e.memberships.length);
 expect(entries.length).toBeGreaterThanOrEqual(3);
 const partial={...catalog,books:catalog.books.filter((b:any)=>b.id===book),units:catalog.units.filter((u:any)=>u.bookId===book),entries};
 const source=openDb(':memory:');source.prepare("INSERT INTO words(id,headword,source) VALUES(100000,'legacy blocker','kb2022')").run();
 installVocabulary(source,{...partial,version:catalog.version-1});activateEvidencePolicy(source,t);saveVocabularySelection(source,{bookId:book,unitId:unit},t);startLearning(source,t);
 source.prepare("UPDATE learning_day_words SET position=-1 WHERE word_id=(SELECT word_id FROM vocabulary_entry_map WHERE entry_key='sign up for sth.')").run();
 const issued=nextLearning(source,t).card!;expect(issued).toBeDefined();expect(issued.wordId).toBeGreaterThan(100000);
 expect(issued.mode).toBe('recognize');expect(issued.options.some(o=>o.id===issued.wordId)).toBe(true);expect(issued.options.some(o=>o.id!==0&&o.id!==issued.wordId)).toBe(true);
 source.prepare("INSERT INTO wrong_words(word_id,last_wrong_at,wrong_count) VALUES (?,?,2)").run(issued.wordId,t.toISOString());
 const issueBefore=source.prepare('SELECT * FROM learning_issues WHERE id=?').get(issued.issueId);const planBefore=source.prepare('SELECT * FROM learning_day_words ORDER BY position').all();const wrongBefore=source.prepare('SELECT * FROM wrong_words WHERE word_id=?').get(issued.wordId);
 const mobile=await openBrowserDatabase(source.serialize());source.close();
 try{
  const backup=vi.fn(async()=>{}),save=vi.fn(async()=>{});await prepareVocabularyDatabase(mobile,partial,{save,createVocabularyBackup:backup},true);expect(backup).toHaveBeenCalledOnce();
  expect(mobile.prepare('SELECT * FROM learning_issues WHERE id=?').get(issued.issueId)).toEqual(issueBefore);expect(mobile.prepare('SELECT * FROM learning_day_words ORDER BY position').all()).toEqual(planBefore);expect(mobile.prepare('SELECT * FROM wrong_words WHERE word_id=?').get(issued.wordId)).toEqual(wrongBefore);
  const assets:typeof fetch=async(input)=>{const file='data/lessons/'+String(input).replace('/offline/lessons/','');return fs.existsSync(file)?Response.json(JSON.parse(fs.readFileSync(file,'utf8'))):new Response('',{status:404})};
  const runtime=createLocalRuntime({db:mobile,save,assetFetch:assets,recordings:{},now:()=>t});
  const turn=await (await runtime.fetch('/api/learning/next')).json();expect(turn.card).toEqual(issued);
  const word=mobile.prepare('SELECT headword FROM words WHERE id=?').get(issued.wordId) as {headword:string};const lesson=await (await runtime.fetch(`/api/word/${issued.wordId}/lesson`)).json();expect(lesson).toMatchObject({status:'ready',lesson:{wordId:issued.wordId,headword:word.headword}});
  const payload={policyVersion:3,issueId:issued.issueId,answerId:'test-answer',...(issued.mode==='recognize'?{choiceId:issued.wordId}:{answer:word.headword})};
  const response=await runtime.fetch('/api/learning/answer',{method:'POST',body:JSON.stringify(payload)});expect(response.status).toBe(200);expect((await response.json()).correct).toBe(true);
  expect((mobile.prepare('SELECT COUNT(*) n FROM learning_events WHERE word_id=?').get(issued.wordId) as {n:number}).n).toBeGreaterThan(0);
 }finally{mobile.close();}
});
