// cd app && npx tsx qa/highschool-lessons/scan-lesson-form-phonics-gaps.ts
import {readFileSync} from 'node:fs';
import Database from 'better-sqlite3';
import {createLessonReader} from '../../server/src/lessons';
import {getSoundSpellingLessons} from '../../web/src/content/sound-spelling';
const catalog=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8'));
const db=new Database('mobile-public/offline/seed.db',{readonly:true,fileMustExist:true});
const map=new Map<string,{id:number;headword:string}>((db.prepare('SELECT m.entry_key,w.id,w.headword FROM vocabulary_entry_map m JOIN words w ON w.id=m.word_id').all() as any[]).map(r=>[r.entry_key,r]));
const read=createLessonReader(); const rows:any[]=[];
for(const e of catalog.entries.filter((e:any)=>e.memberships.some((m:any)=>m.bookId.startsWith('pep2019-')))){
 const word=map.get(e.key);if(!word)continue;
 const result=read(e.key==='Log'?{...word,keyedName:'highschool-log.json'}:word);if(result.status!=='ready')continue;
 for(const f of result.lesson!.forms){
  if(!/^[A-Za-z]+$/.test(f.form)||f.form.toLowerCase()===e.headword.toLowerCase())continue;
  const found=getSoundSpellingLessons(f.form).map(x=>x.headword);
  rows.push({key:e.key,word:word.headword,form:f.form,label:f.label,ipa:f.ipa,found});
 }
}
console.log(JSON.stringify({version:catalog.version,rows},null,2));db.close();
