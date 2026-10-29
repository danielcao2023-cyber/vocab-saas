import {readFileSync} from 'node:fs';
import {expect,it,vi} from 'vitest';
import {openDb} from '../server/src/db';
import {installVocabulary} from '../server/src/vocabulary-import';
import {openBrowserDatabase,asSharedDb} from '../web/src/offline/sqlite';
import {prepareVocabularyDatabase} from '../web/src/offline/runtime';

const catalog=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8'));
const entry=catalog.entries.find((e:{key:string})=>e.key==='Rembrandt');
const oldMeaning='伦布兰特(van Rijn [Ryn], 1609-1669, 荷兰画家)';
const newMeaning='伦布兰特(van Rijn [Ryn], 1606-1669, 荷兰画家)';
const oldCatalog=()=>({...catalog,version:137,entries:[{...entry,meaning:oldMeaning,meaningCorrection:undefined}]});
const corrected=()=>({...catalog,entries:[entry]});
it('corrects the artist birth year and preserves the high-school unit',()=>{
 expect(catalog.version).toBeGreaterThanOrEqual(138);
 expect(entry.meaning).toBe(newMeaning);
 expect(entry.meaningCorrection).toEqual({expected:oldMeaning});
 expect(entry.memberships).toContainEqual({bookId:'pep2019-optional-3',unitId:'pep2019-optional-3:unit1',position:75});
 const lesson=JSON.parse(readFileSync('data/lessons/3485.json','utf8'));
 expect(lesson.headword).toBe('Rembrandt');expect(JSON.stringify(lesson)).not.toContain('1609');
 const db=openDb(':memory:');try{installVocabulary(db,corrected());expect(db.prepare("select meaning_zh from words where headword='Rembrandt'").get()).toEqual({meaning_zh:newMeaning});}finally{db.close();}
});
it('updates only the exact old imported meaning without replacing identity or manual and nonstandard text',()=>{
 for(const [meaning,source,expected] of [[oldMeaning,'词库导入',newMeaning],['用户自定义','manual','用户自定义'],['其他旧库释义','词库导入','其他旧库释义']] as const){
  const db=openDb(':memory:');try{installVocabulary(db,oldCatalog());const before=db.prepare("select id from words where headword='Rembrandt'").get();db.prepare("update words set meaning_zh=?,meaning_source=? where headword='Rembrandt'").run(meaning,source);installVocabulary(db,corrected());expect(db.prepare("select id,meaning_zh from words where headword='Rembrandt'").get()).toEqual({...before as object,meaning_zh:expected});}finally{db.close();}
 }
});
it('backs up and upgrades existing offline databases while preserving an open recognition snapshot',async()=>{
 const src=openDb(':memory:');installVocabulary(src,oldCatalog());const w=src.prepare("select id from words where headword='Rembrandt'").get() as {id:number};
 const options=JSON.stringify([{id:w.id,text:oldMeaning},{id:0,text:'不记得'}]);src.prepare("insert into learning_issues(id,day,word_id,mode,options_json,issued_at) values ('open-rembrandt','2026-10-30',?,'recognize',?,'2026-10-30T00:00:00Z')").run(w.id,options);
 const mobile=await openBrowserDatabase(src.serialize());src.close();
 try{const backup=vi.fn(async()=>{}),save=vi.fn(async()=>{});await prepareVocabularyDatabase(mobile,corrected(),{createVocabularyBackup:backup,save},true);const db=asSharedDb(mobile);expect(backup).toHaveBeenCalledOnce();expect(save).toHaveBeenCalledOnce();expect(db.prepare('select meaning_zh from words where id=?').get(w.id)).toEqual({meaning_zh:newMeaning});expect(db.prepare("select options_json from learning_issues where id='open-rembrandt'").get()).toEqual({options_json:options});}finally{mobile.close();}
});
