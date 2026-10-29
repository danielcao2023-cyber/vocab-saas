import {expect,it,vi} from 'vitest';
import fs from 'node:fs';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import {activateEvidencePolicy} from '../server/src/learning/evidence-migration';
import {saveVocabularySelection} from '../server/src/vocabulary-selection';
import {startLearning,nextLearning,answerLearning} from '../server/src/learning/engine';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
import {prepareVocabularyDatabase} from '../web/src/offline/runtime';
const catalog=JSON.parse(fs.readFileSync('data/vocabulary/catalog.json','utf8'));
const now=new Date('2026-10-29T01:00:00Z');
const cases=[{key:'set out',book:'pep2019-optional-1',unit:'pep2019-optional-1:unit3'},{key:'face down',book:'pep2019-optional-2',unit:'pep2019-optional-2:unit5'}] as const;
function select(c:typeof cases[number],version:number,old:boolean){const e=catalog.entries.find((e:any)=>e.key===c.key);return {...catalog,version,books:catalog.books.filter((b:any)=>b.id===c.book),units:catalog.units.filter((u:any)=>u.bookId===c.book),entries:[{...e,meaning:old?e.meaningCorrection.expected:e.meaning,...(old?{meaningCorrection:undefined}:{}),memberships:e.memberships.filter((m:any)=>m.bookId===c.book&&m.unitId===c.unit)}]}}
it.each(cases.flatMap(c=>[2,3].flatMap(policy=>['online','offline'].map(platform=>({c,policy,platform}))))) ('$c.key open recognition and distractor upgrade in $platform policy $policy',async({c,policy,platform})=>{
 const db0=openDb(':memory:');let mobile:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;
 try {
  const old=select(c,138,true),updated=select(c,139,false),entry=updated.entries[0];
  db0.prepare("INSERT INTO words(headword,source) VALUES ('audit-core','kb2022')").run();installVocabulary(db0,old);if(policy===3)activateEvidencePolicy(db0,now);saveVocabularySelection(db0,{bookId:c.book,unitId:c.unit},now);startLearning(db0,now);const card=nextLearning(db0,now).card!;expect(card).toBeDefined();
  const core=(db0.prepare("SELECT id FROM words WHERE headword='audit-core'").get() as any).id,oldText=entry.meaningCorrection.expected.split('\n')[0],good=entry.meaning.split('\n')[0];
  const options=JSON.stringify([{id:card.wordId,text:oldText},{id:0,text:'不记得'}]);db0.prepare("UPDATE learning_issues SET mode='recognize',options_json=? WHERE id=?").run(options,card.issueId);
  const distractor=JSON.stringify([{id:core,text:'核心'},{id:card.wordId,text:oldText},{id:0,text:'不记得'}]);
  const insert=db0.prepare("INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at,answered_at,answer_id,result_json) VALUES (?,?,?,?,?,?,?,?,?)");
  insert.run('open-other','2026-10-28',core,'recognize',distractor,now.toISOString(),null,null,null);insert.run('done-other','2026-10-28',core,'recognize',distractor,now.toISOString(),now.toISOString(),'done-other-answer','{"correct":true}');
  const changed=JSON.stringify([{id:card.wordId,text:'我自行修改的选项'},{id:0,text:'不记得'}]);insert.run('custom','2026-10-28',card.wordId,'recognize',changed,now.toISOString(),null,null,null);
  const dayBefore=db0.prepare('SELECT * FROM learning_day_words').all(),mapsBefore=db0.prepare('SELECT * FROM vocabulary_entry_map').all();
  let db:any=db0;
  if(platform==='offline'){mobile=await openBrowserDatabase(db0.serialize());const backup=vi.fn(async()=>{});await prepareVocabularyDatabase(mobile,updated,{createVocabularyBackup:backup,save:async()=>{}},true);expect(backup).toHaveBeenCalledOnce();db=asSharedDb(mobile);}else installVocabulary(db,updated);
  expect(db.prepare('SELECT * FROM learning_day_words').all()).toEqual(dayBefore);expect(db.prepare('SELECT * FROM vocabulary_entry_map').all()).toEqual(mapsBefore);
  const replacement=nextLearning(db,now).card!;expect(replacement.issueId).not.toBe(card.issueId);expect(replacement.options).toEqual([{id:card.wordId,text:good},{id:0,text:'不记得'}]);
  const read=(id:string)=>(db.prepare('SELECT options_json FROM learning_issues WHERE id=?').get(id) as any).options_json;
  expect(read('open-other')).toBe(distractor);const other=db.prepare("SELECT options_json FROM learning_issues WHERE word_id=? AND day='2026-10-28' AND answered_at IS NULL").get(core) as any;expect(JSON.parse(other.options_json)).toEqual([{id:core,text:'核心'},{id:card.wordId,text:good},{id:0,text:'不记得'}]);expect(read('done-other')).toBe(distractor);expect(read('custom')).toBe(changed);
  installVocabulary(db,updated);expect(nextLearning(db,now).card?.options[0].text).toBe(good);
  const input={policyVersion:policy,issueId:replacement.issueId,answerId:'answer-1',choiceId:card.wordId};const result=answerLearning(db,input as any,now);expect(result.correct).toBe(true);expect(answerLearning(db,input as any,now)).toEqual(result);
 }finally{mobile?.close();db0.close()}
});
it.each(cases)('$key edited word meaning and corresponding old option stay unchanged',c=>{
 const db=openDb(':memory:');try{const old=select(c,138,true),next=select(c,139,false),entry=next.entries[0];installVocabulary(db,old);const id=(db.prepare('SELECT id FROM words WHERE headword=?').get(c.key) as any).id;db.prepare("UPDATE words SET meaning_zh='我编辑的解释',meaning_source='manual' WHERE id=?").run(id);const options=JSON.stringify([{id,text:entry.meaningCorrection.expected.split('\n')[0]}]);db.prepare("INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at) VALUES ('edited','2026-10-29',?,'recognize',?,?)").run(id,options,now.toISOString());installVocabulary(db,next);expect(db.prepare('SELECT meaning_zh FROM words WHERE id=?').get(id)).toEqual({meaning_zh:'我编辑的解释'});expect((db.prepare("SELECT options_json FROM learning_issues WHERE id='edited'").get() as any).options_json).toBe(options);}finally{db.close()}
});
it('applies the same strict snapshot correction to another imported word and preserves answered and unrelated data',()=>{
 const db=openDb(':memory:');try{
  const original=catalog.entries.find((e:any)=>e.key==='accompany');const old={...catalog,version:138,entries:[{...original,meaning:'旧义第一行\n旧义第二行',meaningCorrection:undefined}]};const updated={...catalog,version:139,entries:[{...original,meaning:'新义第一行\n新义第二行',meaningCorrection:{expected:'旧义第一行\n旧义第二行'}}]};installVocabulary(db,old);const id=(db.prepare('SELECT id FROM words WHERE headword=?').get('accompany') as any).id;const options=JSON.stringify([{id,text:'旧义第一行'},{id:0,text:'不记得'}]);const insert=db.prepare("INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at,answered_at,answer_id,result_json) VALUES (?,?,?,?,?,?,?,?,?)");insert.run('open','2026-10-29',id,'recognize',options,now.toISOString(),null,null,null);insert.run('has-answer','2026-10-29',id,'recognize',options,now.toISOString(),null,'answer-exists',null);insert.run('bad-json','2026-10-29',id,'recognize','not json',now.toISOString(),null,null,null);installVocabulary(db,updated);
  const get=(i:string)=>(db.prepare('SELECT options_json FROM learning_issues WHERE id=?').get(i) as any).options_json;expect(get('open')).toBe(options);const replacement=db.prepare("SELECT options_json FROM learning_issues WHERE word_id=? AND answered_at IS NULL AND answer_id IS NULL AND id NOT IN ('bad-json','has-answer')").get(id) as any;expect(JSON.parse(replacement.options_json)[0].text).toBe('新义第一行');expect(get('has-answer')).toBe(options);expect(get('bad-json')).toBe('not json');
 }finally{db.close()}
});
it.each(cases.flatMap(c=>['online','offline'].map(platform=>({c,platform}))))('$c.key repairs a stale snapshot from an already installed v139 on $platform',async({c,platform})=>{
 const db0=openDb(':memory:');let mobile:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;try{
  const old=select(c,138,true),v139=select(c,139,false),v140=select(c,140,false),entry=v139.entries[0];installVocabulary(db0,old);installVocabulary(db0,v139);
  const id=(db0.prepare('SELECT id FROM words WHERE headword=?').get(c.key) as any).id;const opt=JSON.stringify([{id,text:entry.meaningCorrection.expected.split('\n')[0]}]);
  db0.prepare("INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at) VALUES ('stale','2026-10-29',?,'recognize',?,?)").run(id,opt,now.toISOString());
  let db:any=db0;if(platform==='offline'){mobile=await openBrowserDatabase(db0.serialize());await prepareVocabularyDatabase(mobile,v140,{createVocabularyBackup:async()=>{},save:async()=>{}},true);db=asSharedDb(mobile)}else installVocabulary(db,v140);
  const read=()=>(db.prepare("SELECT options_json FROM learning_issues WHERE word_id=? AND answered_at IS NULL").get(id) as any).options_json;expect((db.prepare("SELECT options_json FROM learning_issues WHERE id='stale'").get() as any).options_json).toBe(opt);expect(JSON.parse(read())[0].text).toBe(entry.meaning.split('\n')[0]);const once=read();installVocabulary(db,v140);expect(read()).toBe(once);
 }finally{mobile?.close();db0.close()}
});
it.each(cases)('$key v139 learner-edited value equal to the correction does not authorize snapshot changes',c=>{
 const db=openDb(':memory:');try{const old=select(c,138,true),v139=select(c,139,false),v140=select(c,140,false),entry=v139.entries[0];installVocabulary(db,old);installVocabulary(db,v139);const id=(db.prepare('SELECT id FROM words WHERE headword=?').get(c.key) as any).id;db.prepare("UPDATE words SET meaning_source='manual' WHERE id=?").run(id);const opt=JSON.stringify([{id,text:entry.meaningCorrection.expected.split('\n')[0]}]);db.prepare("INSERT INTO learning_issues(id,day,word_id,mode,options_json,issued_at) VALUES ('manual','2026-10-29',?,'recognize',?,?)").run(id,opt,now.toISOString());installVocabulary(db,v140);expect((db.prepare("SELECT options_json FROM learning_issues WHERE id='manual'").get() as any).options_json).toBe(opt);}finally{db.close()}
});
