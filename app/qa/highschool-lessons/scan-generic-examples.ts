// Read-only screening, not a linguistic correctness verdict.
// npx tsx qa/highschool-lessons/scan-generic-examples.ts
import {readFileSync} from 'node:fs';
import Database from 'better-sqlite3';
import {createLessonReader} from '../../server/src/lessons';
const catalog=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8'));
const db=new Database('mobile-public/offline/seed.db',{readonly:true,fileMustExist:true});
const mapping=new Map<string,{id:number,headword:string}>((db.prepare('select m.entry_key,w.id,w.headword from vocabulary_entry_map m join words w on w.id=m.word_id').all() as any[]).map(row=>[row.entry_key,row]));
const patterns=['the article discusses','the report discusses','the lesson describes','the book discusses','the report mentions','the label describes'];
const read=createLessonReader(), findings=[] as {key:string;id:number;sense:string;example:string;pattern:string}[];
let total=0,pending=0;
for(const entry of catalog.entries){
 if(!entry.memberships.some((member:any)=>member.bookId.startsWith('pep2019-')))continue;
 total++;const word=mapping.get(entry.key);if(!word){pending++;continue}
 const response=read(entry.key==='Log'?{...word,keyedName:'highschool-log.json'}:word);
 if(response.status!=='ready'){pending++;continue}
 for(const sense of response.lesson.senses)for(const example of sense.examples){
  const pattern=patterns.find(x=>example.en.toLowerCase().includes(x));
  if(pattern)findings.push({key:entry.key,id:word.id,sense:sense.id,example:example.en,pattern});
 }
}
console.log(JSON.stringify({catalogVersion:catalog.version,scope:'unique pep2019 stable keys; current built seed; main senses only',total,pending,patterns,findings},null,2));db.close();
