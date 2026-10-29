import {expect,it} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import {activateEvidencePolicy} from '../server/src/learning/evidence-migration';
import {saveVocabularySelection} from '../server/src/vocabulary-selection';
import {startLearning,nextLearning} from '../server/src/learning/engine';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
import {prepareVocabularyDatabase} from '../web/src/offline/runtime';
import catalog from '../data/vocabulary/catalog.json';
import contractLesson from '../data/lessons/4002.json';
import {getSoundSpellingLesson} from '../web/src/content/sound-spelling/index';
const cases=[['bow','n. 弓；鞠躬；船首\nadj. 弯曲的\nvi. 鞠躬；弯腰\nvt. 鞠躬；弯腰','vi. 鞠躬；弯腰','pep2019-optional-1','pep2019-optional-1:unit4'],['contract','n. 合同；婚约\nvt. 感染；订约；使缩短\nvi. 收缩；感染；订约','vt. 感染；订约；使缩短','pep2019-optional-4','pep2019-optional-4:unit4']] as const;
const t=new Date('2026-10-29T01:00:00Z');
function sub(key:string,book:string,unit:string,old?:string){const e=catalog.entries.find(x=>x.key===key)!;return {...catalog,version:old===undefined?159:158,books:catalog.books.filter(b=>b.id===book),units:catalog.units.filter(u=>u.bookId===book),entries:[{...e,...(old===undefined?{}:{meaning:old,meaningCorrection:undefined}),memberships:e.memberships.filter((m:{unitId:string|null})=>m.unitId===unit)}]};}
it.each(cases)('%s prioritizes textbook verb while preserving both noun and verb meanings and phonetic', (word,old,first)=>{
 const e=catalog.entries.find(e=>e.key===word)!;expect(e.meaning.split('\n')[0]).toBe(first);expect(e).toMatchObject({meaningCorrection:{expected:old}});expect(new Set(e.meaning.split('\n'))).toEqual(new Set(old.split('\n')));
 for(const [meaning,source,flag] of [['learner','manual',null],[old,'词库导入','需复核'],['other','词库导入',null]] as const){const db=openDb(':memory:');try{const [,, ,book,unit]=cases.find(c=>c[0]===word)!;installVocabulary(db,sub(word,book,unit,old));db.prepare('UPDATE words SET meaning_zh=?,meaning_source=?,meaning_flag=?,phonetic=? WHERE headword=?').run(meaning,source,flag,'custom IPA',word);installVocabulary(db,sub(word,book,unit));expect(db.prepare('SELECT meaning_zh,meaning_source,meaning_flag,phonetic FROM words WHERE headword=?').get(word)).toEqual({meaning_zh:meaning,meaning_source:source,meaning_flag:flag,phonetic:'custom IPA'});}finally{db.close()}}
});
it.each(cases.flatMap(([word,old,first,book,unit])=>[2,3].flatMap(policy=>['online','offline'].map(platform=>({word,old,first,book,unit,policy,platform})))))('preserves an existing bound noun dictation through $platform v$policy catalog upgrade for $word',async({word,old,first,book,unit,policy,platform})=>{
 const source=openDb(':memory:');let mobile:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;try{installVocabulary(source,sub(word,book,unit,old));if(policy===3)activateEvidencePolicy(source,t);saveVocabularySelection(source,{bookId:book,unitId:unit},t);startLearning(source,t);const before=nextLearning(source,t).card!;
 source.prepare("UPDATE learning_issues SET mode='dictation',audio_variant='noun',options_json='[]' WHERE id=?").run(before.issueId);const issue=source.prepare('SELECT * FROM learning_issues WHERE id=?').get(before.issueId);let db:any=source;
 if(platform==='offline'){mobile=await openBrowserDatabase(source.serialize());let backed=false;await prepareVocabularyDatabase(mobile,sub(word,book,unit),{createVocabularyBackup:async()=>{backed=true},save:async()=>expect(backed).toBe(true)},true);db=asSharedDb(mobile)}else installVocabulary(db,sub(word,book,unit));
 expect(db.prepare('SELECT * FROM learning_issues WHERE id=?').get(before.issueId)).toEqual(issue);expect(nextLearning(db,t).card).toMatchObject({issueId:before.issueId,mode:'dictation',audioVariant:'noun'});expect(db.prepare('SELECT meaning_zh FROM words WHERE headword=?').get(word).meaning_zh.split('\n')[0]).toBe(first);
 }finally{mobile?.close();source.close()}
});
it('aligns contract lesson and sound-spelling with the verb while documenting the noun',()=>{
 const m=getSoundSpellingLesson('contract')!;
 expect(contractLesson.pronunciation.ipa).toBe('/kənˈtrækt/');expect(m.ipa).toBe('/kənˈtrækt/');expect(m.variantNote).toContain('名词');expect(m.chunks.map(c=>c.stress)).toEqual(['none','primary']);
});

it.each(cases.flatMap(([word,old,first,book,unit])=>[2,3].flatMap(policy=>['online','offline'].flatMap(platform=>['recognize','spell'].map(mode=>({word,old,first,book,unit,policy,platform,mode}))))))
 ('reissues an open $mode question for $word on $platform v$policy after the meaning change',async({word,old,first,book,unit,policy,platform,mode})=>{
 const {answerLearning}=await import('../server/src/learning/engine');const source=openDb(':memory:');let mobile:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;
 try{installVocabulary(source,sub(word,book,unit,old));if(policy===3)activateEvidencePolicy(source,t);saveVocabularySelection(source,{bookId:book,unitId:unit},t);startLearning(source,t);const card=nextLearning(source,t).card!;
 const options=mode==='recognize'?[{id:card.wordId,text:old.split('\n')[0]},{id:0,text:'不记得'}]:[];
 source.prepare('UPDATE learning_issues SET mode=?,options_json=? WHERE id=?').run(mode,JSON.stringify(options),card.issueId);let db:any=source;
 if(platform==='offline'){mobile=await openBrowserDatabase(source.serialize());await prepareVocabularyDatabase(mobile,sub(word,book,unit),{createVocabularyBackup:async()=>{},save:async()=>{}},true);db=asSharedDb(mobile)}else installVocabulary(db,sub(word,book,unit));
 const next=nextLearning(db,t).card!;expect(next).toMatchObject({wordId:card.wordId,mode});expect(next.issueId).not.toBe(card.issueId);
 if(mode==='recognize')expect(next.options.find((x:{id:number})=>x.id===card.wordId)?.text).toBe(first);else expect(next.meaning).toContain(first);
 const body={policyVersion:policy,issueId:card.issueId,answerId:'stale',...(mode==='recognize'?{choiceId:card.wordId}:{answer:word})};expect(()=>answerLearning(db,body as any,t)).toThrow(/题目已更新/);
 const fresh={...body,issueId:next.issueId,answerId:'fresh'};const result=answerLearning(db,fresh as any,t);expect(result.correct).toBe(true);expect(answerLearning(db,fresh as any,t)).toEqual(result);
 }finally{mobile?.close();source.close()}
});

it.each(cases.flatMap(([word,old,_first,book,unit])=>[2,3].flatMap(policy=>['online','offline'].map(platform=>({word,old,book,unit,policy,platform})))))
 ('preserves answered history and replay for $word on $platform v$policy',async({word,old,book,unit,policy,platform})=>{
 const {answerLearning}=await import('../server/src/learning/engine');const source=openDb(':memory:');let mobile:Awaited<ReturnType<typeof openBrowserDatabase>>|undefined;
 try{installVocabulary(source,sub(word,book,unit,old));if(policy===3)activateEvidencePolicy(source,t);saveVocabularySelection(source,{bookId:book,unitId:unit},t);startLearning(source,t);const card=nextLearning(source,t).card!;
 source.prepare("UPDATE learning_issues SET mode='recognize',options_json=? WHERE id=?").run(JSON.stringify([{id:card.wordId,text:old.split('\n')[0]},{id:0,text:'不记得'}]),card.issueId);
 const answer={policyVersion:policy,issueId:card.issueId,answerId:'saved',choiceId:card.wordId},result=answerLearning(source,answer as any,t),issue=source.prepare('SELECT * FROM learning_issues WHERE id=?').get(card.issueId),events=source.prepare('SELECT * FROM review_logs ORDER BY id').all();let db:any=source;
 if(platform==='offline'){mobile=await openBrowserDatabase(source.serialize());await prepareVocabularyDatabase(mobile,sub(word,book,unit),{createVocabularyBackup:async()=>{},save:async()=>{}},true);db=asSharedDb(mobile)}else installVocabulary(db,sub(word,book,unit));
 expect(db.prepare('SELECT * FROM learning_issues WHERE id=?').get(card.issueId)).toEqual(issue);expect(db.prepare('SELECT * FROM review_logs ORDER BY id').all()).toEqual(events);expect(answerLearning(db,answer as any,t)).toEqual(result);
 }finally{mobile?.close();source.close()}
});
