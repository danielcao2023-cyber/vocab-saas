import {expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import {activateEvidencePolicy} from '../server/src/learning/evidence-migration';
import {saveVocabularySelection} from '../server/src/vocabulary-selection';
import {startLearning,nextLearning,answerLearning} from '../server/src/learning/engine';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
import {prepareVocabularyDatabase} from '../web/src/offline/runtime';

const catalog=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8'));
const entries=['chart','cabbage'].map(key=>catalog.entries.find((entry:any)=>entry.key===key));
const book='pep2019-optional-1',unit=book+':unit1',t=new Date('2026-10-29T01:00:00Z');
const partial=(old=false)=>({...catalog,version:old?136:137,entries:entries.map((entry:any)=>old?{...entry,meaning:entry.meaningCorrection.expected,meaningCorrection:undefined}:entry)});
function oldDb(core=false){const db=openDb(':memory:');if(core)db.prepare("INSERT INTO words(headword,source,meaning_zh,meaning_source) VALUES ('cabbage','kb2022','n. 卷心菜','ecdict')").run();installVocabulary(db,partial(true));return db;}

it('creates clean text on new installations without changing meaning',()=>{
 expect(catalog.version).toBeGreaterThanOrEqual(137);
 expect(entries[0].meaning).toBe(entries[0].meaningCorrection.expected+'）');
 expect(entries[1].meaning).toBe(entries[1].meaningCorrection.expected.replace('（俚)','（俚）'));
 const db=openDb(':memory:');try{installVocabulary(db,partial());for(const e of entries) expect(db.prepare('SELECT meaning_zh FROM words WHERE headword=?').get(e.headword)).toEqual({meaning_zh:e.meaning});}finally{db.close();}
});
it('upgrades exact legacy imported text while preserving core identity and user edits',()=>{
 const db=oldDb(true);try{
  const before=db.prepare("SELECT id,meaning_zh,source,meaning_source FROM words WHERE headword='cabbage'").get();
  installVocabulary(db,partial());expect(db.prepare("SELECT meaning_zh FROM words WHERE headword='chart'").get()).toEqual({meaning_zh:entries[0].meaning});
  expect(db.prepare("SELECT id,meaning_zh,source,meaning_source FROM words WHERE headword='cabbage'").get()).toEqual(before);
 }finally{db.close();}
 const edited=oldDb();try{edited.prepare("UPDATE words SET meaning_zh='我的解释',meaning_source='manual' WHERE headword='chart'").run();edited.prepare("UPDATE words SET meaning_zh='我的卷心菜',meaning_source='manual' WHERE headword='cabbage'").run();installVocabulary(edited,partial());expect(edited.prepare("SELECT meaning_zh FROM words WHERE headword='chart'").get()).toEqual({meaning_zh:'我的解释'});expect(edited.prepare("SELECT meaning_zh FROM words WHERE headword='cabbage'").get()).toEqual({meaning_zh:'我的卷心菜'});}finally{edited.close();}
});
it('backs up the offline upgrade and preserves an open recognition snapshot and answer retry',async()=>{
 const source=oldDb();activateEvidencePolicy(source,t);saveVocabularySelection(source,{bookId:book,unitId:unit},t);startLearning(source,t);const card=nextLearning(source,t).card!;
 const chart=source.prepare("SELECT id FROM words WHERE headword='chart'").get() as {id:number};
 expect(card.wordId).toBe(chart.id);
 const options=[{id:chart.id,text:entries[0].meaningCorrection.expected.split('\n')[0]},{id:0,text:'不记得'}];
 source.prepare("UPDATE learning_issues SET mode='recognize',options_json=? WHERE id=?").run(JSON.stringify(options),card.issueId);
 const mobile=await openBrowserDatabase(source.serialize());source.close();
 try{const backup=vi.fn(async()=>{}),save=vi.fn(async()=>{});await prepareVocabularyDatabase(mobile,partial(),{createVocabularyBackup:backup,save},true);expect(backup).toHaveBeenCalledOnce();expect(save).toHaveBeenCalledOnce();const db=asSharedDb(mobile);
  expect(db.prepare('SELECT meaning_zh FROM words WHERE id=?').get(chart.id)).toEqual({meaning_zh:entries[0].meaning});
  expect(nextLearning(db,t).card?.options).toEqual(options);
  const input={policyVersion:3 as const,issueId:card.issueId,answerId:'retry-id',choiceId:chart.id};const result=answerLearning(db,input,t);expect(result.correct).toBe(true);expect(answerLearning(db,input,t)).toEqual(result);
 }finally{mobile.close();}
});

it('updates imported cabbage while preserving an already displayed distractor snapshot',()=>{
 const db=oldDb();try{
  const cabbage=db.prepare("SELECT id FROM words WHERE headword='cabbage'").get() as {id:number};
  const chart=db.prepare("SELECT id FROM words WHERE headword='chart'").get() as {id:number};
  const options=JSON.stringify([{id:chart.id,text:entries[0].meaning.split('\n')[0]},{id:cabbage.id,text:entries[1].meaningCorrection.expected}]);
  db.prepare("INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at) VALUES ('open','2026-10-29',?,'recognize',?,?)").run(chart.id,options,t.toISOString());
  installVocabulary(db,partial());
  expect(db.prepare('SELECT meaning_zh FROM words WHERE id=?').get(cabbage.id)).toEqual({meaning_zh:entries[1].meaning});
  expect(db.prepare("SELECT options_json FROM learning_issues WHERE id='open'").get()).toEqual({options_json:options});
 }finally{db.close();}
});
