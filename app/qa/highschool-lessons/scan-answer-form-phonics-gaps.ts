// Run from app/: npx tsx qa/highschool-lessons/scan-answer-form-phonics-gaps.ts
import {readFileSync} from 'node:fs';
import Database from 'better-sqlite3';
import {answerForms,mainHeadwords} from '../../server/src/text';
import {getSoundSpellingLessons} from '../../web/src/content/sound-spelling';
const c=JSON.parse(readFileSync('data/vocabulary/catalog.json','utf8'));
const db=new Database('mobile-public/offline/seed.db',{readonly:true,fileMustExist:true});
const map=new Map((db.prepare('SELECT m.entry_key,w.headword FROM vocabulary_entry_map m JOIN words w ON w.id=m.word_id').all() as any[]).map(r=>[r.entry_key,r.headword]));
const rows=c.entries.filter((e:any)=>e.memberships.some((x:any)=>x.bookId.startsWith('pep2019-'))).flatMap((e:any)=>{
 const shown=map.get(e.key) as string|undefined;if(!shown)return [];
 const main=new Set(mainHeadwords(shown).map(x=>x.toLowerCase()));
 return answerForms(shown).filter(f=>!main.has(f.toLowerCase())).map(form=>({key:e.key,shown,form,found:getSoundSpellingLessons(form).map(l=>l.headword)}));
});
console.log(JSON.stringify({version:c.version,rows},null,2));db.close();
