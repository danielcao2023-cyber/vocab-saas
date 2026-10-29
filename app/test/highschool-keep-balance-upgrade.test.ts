import {expect,it} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {vi} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import {answerV3} from '../server/src/learning/evidence-engine';
import {answerLearning} from '../server/src/learning/engine';
import {ensureEvidenceWord} from '../server/src/learning/evidence-store';
import {createLessonReader} from '../server/src/lessons';
import {copyReviewedLessons} from '../scripts/lesson-assets';
import {openBrowserDatabase} from '../web/src/offline/sqlite';
import {createLocalRuntime} from '../web/src/offline/runtime';
import {T,database} from './v3-helpers';

const full=JSON.parse(fs.readFileSync('data/vocabulary/catalog.json','utf8'));
const selected=full.entries.find((e:any)=>e.key==='keep balance');
const catalog={version:full.version,books:full.books,units:full.units,entries:[selected]};
const old={...catalog,version:catalog.version-1,entries:[{...selected,headword:'keep balance',headwordCorrection:undefined}]};
it.each(['spell','dictation'])('migrates identity and keeps an open old %s answer replayable',(mode)=>{
 expect(selected.headword).toBe('keep a balance');
 const db=openDb(':memory:');try{
  installVocabulary(db,old);const word=db.prepare("SELECT id FROM words WHERE headword='keep balance'").get() as {id:number};
  ensureEvidenceWord(db,word.id,T);const day='2026-10-17';
  db.prepare('INSERT INTO learning_days(day,created_at,policy_version) VALUES (?,?,3)').run(day,T.toISOString());
  db.prepare("INSERT INTO learning_day_words(day,word_id,position,initial_book,is_new,targets,available_at) VALUES (?,?,0,'new',1,'[0,0,0]',?)").run(day,word.id,T.toISOString());
  db.prepare("INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at) VALUES ('old',?,?,?,'[]',?)").run(day,word.id,mode,T.toISOString());
  installVocabulary(db,catalog);expect(db.prepare('SELECT id,headword FROM words').get()).toEqual({id:word.id,headword:'keep a balance'});
  const request={policyVersion:3 as const,issueId:'old',answerId:'old-answer',answer:'keep balance'};
  const result=answerV3(db,request,T);expect(result.correct).toBe(true);expect(answerV3(db,request,T)).toEqual(result);
  expect((db.prepare("SELECT COUNT(*) n FROM learning_events WHERE issue_id='old' AND kind='probe_success'").get() as any).n).toBe(1);
 }finally{db.close();}
});
it.each(['spell','dictation'])('preserves an open V2 %s answer and replay',(mode)=>{
 const db=openDb(':memory:');try{
  installVocabulary(db,old);const word=db.prepare("SELECT id FROM words WHERE headword='keep balance'").get() as {id:number};
  ensureEvidenceWord(db,word.id,T);const day='2026-10-17';
  db.prepare('INSERT INTO learning_days(day,created_at,policy_version) VALUES (?,?,2)').run(day,T.toISOString());
  db.prepare("INSERT INTO learning_day_words(day,word_id,position,initial_book,is_new,targets,available_at) VALUES (?,?,0,'new',1,'[0,0,0]',?)").run(day,word.id,T.toISOString());
  db.prepare("INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at) VALUES ('old-v2',?,?,?,'[]',?)").run(day,word.id,mode,T.toISOString());
  installVocabulary(db,catalog);const request={issueId:'old-v2',answerId:'old-v2-answer',answer:'keep balance'} as any;
  const result=answerLearning(db,request,T);expect(result.correct).toBe(true);expect(answerLearning(db,request,T)).toEqual(result);
  expect((db.prepare("SELECT COUNT(*) n FROM review_logs WHERE answer_id='old-v2-answer'").get() as any).n).toBe(1);
 }finally{db.close();}
});
it('serves new and preserved old lessons independent of the database ID',()=>{
 const read=createLessonReader();
 for(const h of ['keep balance','keep a balance'])expect(read({id:999999,headword:h})).toMatchObject({status:'ready',lesson:{headword:h,wordId:999999}});
});
it('uses only the corrected spelling for new cards and keeps manual edits unchanged',async()=>{
 const {acceptedSpellings}=await import('../server/src/study');expect(acceptedSpellings('keep a balance')).toEqual(['keep a balance']);
 const db=openDb(':memory:');try{installVocabulary(db,old);db.prepare("UPDATE words SET meaning_source='manual',meaning_zh='自定义' WHERE headword='keep balance'").run();installVocabulary(db,catalog);expect(db.prepare('SELECT headword,meaning_zh FROM words').get()).toEqual({headword:'keep balance',meaning_zh:'自定义'});}finally{db.close();}
});
it('does not rename or merge when the corrected headword already belongs to a core word',()=>{
 const db=openDb(':memory:');try{installVocabulary(db,old);const before=db.prepare("SELECT id FROM words WHERE headword='keep balance'").get();
 db.prepare("INSERT INTO words(headword,source) VALUES ('keep a balance','kb2022')").run();installVocabulary(db,catalog);
 expect(db.prepare("SELECT id FROM words WHERE headword='keep balance'").get()).toEqual(before);
 expect((db.prepare("SELECT COUNT(*) n FROM words").get() as any).n).toBe(2);
 }finally{db.close();}
});
it('bundles and serves a corrected lesson at a different offline ID',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'balance-'));const input=fs.mkdtempSync(path.join(os.tmpdir(),'balance-src-'));
 const source=database(0);source.prepare("INSERT INTO words(id,headword,source) VALUES (7777,'keep a balance','vocabulary')").run();const db=await openBrowserDatabase(source.serialize());source.close();
 try{fs.cpSync('data/lessons/keyed',path.join(input,'keyed'),{recursive:true});copyReviewedLessons(input,dir,[{id:7777,headword:'keep a balance',source:'vocabulary'}]);
 const asset=vi.fn(async(url:any)=>String(url).endsWith('/keyed/keep-a-balance.json')?Response.json(JSON.parse(fs.readFileSync(path.join(dir,'keyed/keep-a-balance.json'),'utf8'))):new Response('',{status:404}));
 const runtime=createLocalRuntime({db,save:async()=>{},assetFetch:asset,recordings:{},now:()=>T});expect(await(await runtime.fetch('/api/word/7777/lesson')).json()).toMatchObject({status:'ready',lesson:{wordId:7777,headword:'keep a balance'}});
 }finally{db.close();fs.rmSync(dir,{recursive:true,force:true});fs.rmSync(input,{recursive:true,force:true});}
});
