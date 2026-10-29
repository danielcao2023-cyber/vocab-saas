import {expect,it,vi} from 'vitest';
import os from 'node:os';
import path from 'node:path';
import {copyReviewedLessons} from '../scripts/lesson-assets';
import {openBrowserDatabase} from '../web/src/offline/sqlite';
import {createLocalRuntime} from '../web/src/offline/runtime';
import {database,T} from './v3-helpers';
import fs from 'node:fs';
import {openDb} from '../server/src/db';
import {answerV3} from '../server/src/learning/evidence-engine';
import {answerLearning} from '../server/src/learning/engine';
import {ensureEvidenceWord} from '../server/src/learning/evidence-store';
import {installVocabulary} from '../server/src/vocabulary-import';
import {createLessonReader} from '../server/src/lessons';
import {acceptedSpellings} from '../server/src/study';
const catalog=JSON.parse(fs.readFileSync('data/vocabulary/catalog.json','utf8'));
const old='the Naadam festival', updated='the Naadam Festival';
const previous={...catalog,version:catalog.version-1,entries:catalog.entries.map((e:any)=>e.key===old?{...e,headword:old,headwordCorrection:undefined}:e)};
it('upgrades the display while keeping word identity, membership, and learning history',()=>{
 const db=openDb(':memory:');try{
  installVocabulary(db,previous);const before=db.prepare('SELECT id FROM words WHERE headword=?').get(old) as {id:number};
  db.prepare("INSERT INTO wrong_words(word_id,last_wrong_at,wrong_count) VALUES (?,datetime('now'),2)").run(before.id);
  const members=db.prepare('SELECT * FROM vocabulary_members WHERE word_id=?').all(before.id);
  installVocabulary(db,catalog);expect(db.prepare('SELECT id FROM words WHERE headword=?').get(updated)).toEqual(before);
  expect(db.prepare('SELECT * FROM vocabulary_members WHERE word_id=?').all(before.id)).toEqual(members);
  expect(db.prepare('SELECT wrong_count FROM wrong_words WHERE word_id=?').get(before.id)).toEqual({wrong_count:2});
 }finally{db.close();}
});
it('serves old and new spelling at any word ID',()=>{
 const read=createLessonReader();for(const headword of [old,updated])expect(read({id:999999,headword})).toMatchObject({status:'ready',lesson:{wordId:999999,headword}});
});
it('preserves answers under capitalization-only changes',()=>expect(acceptedSpellings(old)).toEqual(acceptedSpellings(updated)));
it('does not overwrite a learner-edited word or collide with a core word',()=>{
 for(const variant of ['edited','core']){
  const db=openDb(':memory:');try{installVocabulary(db,previous);const before=db.prepare('SELECT id FROM words WHERE headword=?').get(old) as {id:number};
   if(variant==='edited')db.prepare("UPDATE words SET meaning_source='用户编辑' WHERE id=?").run(before.id);
   else db.prepare("INSERT INTO words(headword,source) VALUES (?,'kb2022')").run(updated);
   installVocabulary(db,catalog);expect(db.prepare('SELECT headword FROM words WHERE id=?').get(before.id)).toEqual({headword:old});
  }finally{db.close();}
 }
});

it('bundles both capitalization variants and serves each offline at runtime IDs',async()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'naadam-out-')),input=fs.mkdtempSync(path.join(os.tmpdir(),'naadam-in-'));
 const source=database(2);source.prepare("INSERT INTO words(id,headword,source) VALUES (7777,?,'vocabulary'),(7778,?,'vocabulary')").run(old,updated);const db=await openBrowserDatabase(source.serialize());source.close();
 try{fs.cpSync('data/lessons/keyed',path.join(input,'keyed'),{recursive:true});copyReviewedLessons(input,out,[{id:7777,headword:old,source:'vocabulary'},{id:7778,headword:updated,source:'vocabulary'}]);const fetch=vi.fn(async(url:any)=>{const file=path.join(out,String(url).replace(/^.*\/keyed\//,'keyed/'));return fs.existsSync(file)?Response.json(JSON.parse(fs.readFileSync(file,'utf8'))):new Response('',{status:404});});const runtime=createLocalRuntime({db,save:async()=>{},assetFetch:fetch,recordings:{},now:()=>T});for(const [id,headword] of [[7777,old],[7778,updated]] as const)expect(await (await runtime.fetch('/api/word/'+id+'/lesson')).json()).toMatchObject({status:'ready',lesson:{wordId:id,headword}});
 }finally{db.close();fs.rmSync(out,{recursive:true,force:true});fs.rmSync(input,{recursive:true,force:true});}
});

it.each([[2,'none'],[3,'none'],[2,'core'],[3,'core'],[2,'edited'],[3,'edited']])('preserves issued V%s answers and retries across the case update (conflict=%s)',(policy,conflict)=>{
 const selected=catalog.entries.find((e:any)=>e.key===old),next={version:catalog.version,books:catalog.books,units:catalog.units,entries:[selected]},before={...next,version:next.version-1,entries:[{...selected,headword:old,headwordCorrection:undefined}]};
 const db=openDb(':memory:');try{installVocabulary(db,before);const word=db.prepare('SELECT id FROM words WHERE headword=?').get(old) as {id:number};ensureEvidenceWord(db,word.id,T);const day='2026-10-17';db.prepare('INSERT INTO learning_days(day,created_at,policy_version) VALUES (?,?,?)').run(day,T.toISOString(),policy);db.prepare("INSERT INTO learning_day_words(day,word_id,position,initial_book,is_new,targets,available_at) VALUES (?,?,0,'new',1,'[0,0,0]',?)").run(day,word.id,T.toISOString());db.prepare("INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at) VALUES ('issued',?,?,'spell','[]',?)").run(day,word.id,T.toISOString());if(conflict==='core')db.prepare("INSERT INTO words(headword,source) VALUES (?,'kb2022')").run(updated);if(conflict==='edited')db.prepare("UPDATE words SET meaning_source='用户编辑' WHERE id=?").run(word.id);installVocabulary(db,next);expect(db.prepare('SELECT headword FROM words WHERE id=?').get(word.id)).toEqual({headword:conflict==='none'?updated:old});const request={policyVersion:3 as const,issueId:'issued',answerId:'answer-1',answer:old};const result=policy===3?answerV3(db,request,T):answerLearning(db,request,T);expect(result.correct).toBe(true);expect(policy===3?answerV3(db,request,T):answerLearning(db,request,T)).toEqual(result);
 }finally{db.close();}
});
